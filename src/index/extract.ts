import type { SymbolEdge, SymbolNode } from "../core/types.js";

const FN_TS =
  /^(export\s+)?(async\s+)?function\s+(\w+)|^(export\s+)?const\s+(\w+)\s*=\s*(async\s+)?\(|^(export\s+)?const\s+(\w+)\s*=\s*(async\s+)?[^=]*=>/gm;
const CLASS_TS = /^(export\s+)?class\s+(\w+)/gm;
const METHOD_LINE = /^\s+(?:(?:public|private|protected|static|async)\s+)*(\w+)\s*\(/;
const IMPORT_TS = /import\s+.*?from\s+['"]([^'"]+)['"]/g;
const CALL_TS = /\b([A-Za-z_]\w*)\s*\(/g;

const DEF_PY = /^(\s*)def\s+(\w+)\s*\(|^(\s*)class\s+(\w+)/gm;
const IMPORT_PY = /^(?:from\s+(\S+)\s+import|import\s+(\S+))/gm;

export function extractTypeScriptSymbols(
  file: string,
  content: string,
): SymbolNode[] {
  const lines = content.split("\n");
  const nodes: SymbolNode[] = [];
  let match: RegExpExecArray | null;

  FN_TS.lastIndex = 0;
  while ((match = FN_TS.exec(content)) !== null) {
    const name = match[3] ?? match[5] ?? match[7];
    if (!name) continue;
    const startLine = content.slice(0, match.index).split("\n").length;
    const endLine = findBlockEnd(lines, startLine);
    nodes.push(makeNode(file, name, "function", startLine, endLine, lines));
  }

  CLASS_TS.lastIndex = 0;
  while ((match = CLASS_TS.exec(content)) !== null) {
    const name = match[2];
    if (!name) continue;
    const startLine = content.slice(0, match.index).split("\n").length;
    const endLine = findBlockEnd(lines, startLine);
    nodes.push(makeNode(file, name, "class", startLine, endLine, lines));

    for (let lineNum = startLine + 1; lineNum < endLine; lineNum++) {
      const line = lines[lineNum - 1] ?? "";
      const methodMatch = line.match(METHOD_LINE);
      if (!methodMatch?.[1]) continue;
      const methodName = methodMatch[1];
      if (["constructor", "if", "for", "while", "switch"].includes(methodName)) continue;
      const qualified = `${name}.${methodName}`;
      const methodEnd = findBlockEnd(lines, lineNum);
      nodes.push(makeNode(file, qualified, "method", lineNum, methodEnd, lines));
    }
  }

  if (nodes.length === 0) {
    nodes.push(makeNode(file, file.split("/").pop() ?? file, "module", 1, lines.length, lines));
  }
  return nodes;
}

export function extractPythonSymbols(file: string, content: string): SymbolNode[] {
  const lines = content.split("\n");
  const nodes: SymbolNode[] = [];
  let match: RegExpExecArray | null;

  DEF_PY.lastIndex = 0;
  while ((match = DEF_PY.exec(content)) !== null) {
    const name = match[2] ?? match[4];
    if (!name) continue;
    const kind = match[2] ? "function" : "class";
    const startLine = content.slice(0, match.index).split("\n").length;
    const endLine = findPythonBlockEnd(lines, startLine);
    nodes.push(makeNode(file, name, kind as "function" | "class", startLine, endLine, lines));
  }

  if (nodes.length === 0) {
    nodes.push(makeNode(file, file.split("/").pop() ?? file, "module", 1, lines.length, lines));
  }
  return nodes;
}

export function extractCalls(content: string): string[] {
  const names = new Set<string>();
  let m: RegExpExecArray | null;
  CALL_TS.lastIndex = 0;
  while ((m = CALL_TS.exec(content)) !== null) {
    const n = m[1];
    if (n && !["if", "for", "while", "switch", "catch", "function", "return"].includes(n)) {
      names.add(n);
    }
  }
  return [...names];
}

export function extractImportsTs(content: string): string[] {
  const out: string[] = [];
  let m: RegExpExecArray | null;
  IMPORT_TS.lastIndex = 0;
  while ((m = IMPORT_TS.exec(content)) !== null) {
    if (m[1]) out.push(m[1]);
  }
  return out;
}

export interface NamedImport {
  spec: string;
  names: string[];
}

export interface ReExportBinding {
  spec: string;
  /** Empty `names` means `export * from`. */
  names: Array<{ exported: string; source: string }>;
}

export interface ExportLocation {
  file: string;
  symbolName: string;
}

/** Parse TS import declarations into module spec + imported symbol names. */
export function extractNamedImportsTs(content: string): NamedImport[] {
  const out: NamedImport[] = [];
  const patterns = [
    /import\s+(?:type\s+)?\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/g,
    /import\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g,
    /import\s+\*\s+as\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g,
  ];

  for (const re of patterns) {
    let m: RegExpExecArray | null;
    re.lastIndex = 0;
    while ((m = re.exec(content)) !== null) {
      if (re === patterns[0]) {
        const names = (m[1] ?? "")
          .split(",")
          .map((part) => part.trim().split(/\s+as\s+/)[0]?.trim())
          .filter((n): n is string => Boolean(n));
        if (m[2] && names.length) out.push({ spec: m[2], names });
      } else if (m[1] && m[2]) {
        out.push({ spec: m[2], names: [m[1]] });
      }
    }
  }

  return out;
}

/** Parse TS re-export declarations (`export { x } from` and `export * from`). */
export function extractReExportsTs(content: string): ReExportBinding[] {
  const out: ReExportBinding[] = [];
  const namedRe = /export\s+(?:type\s+)?\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/g;
  let m: RegExpExecArray | null;
  while ((m = namedRe.exec(content)) !== null) {
    const names = (m[1] ?? "")
      .split(",")
      .map((part) => {
        const trimmed = part.trim();
        if (!trimmed) return null;
        const asMatch = trimmed.match(/^(\w+)\s+as\s+(\w+)$/);
        if (asMatch) return { source: asMatch[1]!, exported: asMatch[2]! };
        return { source: trimmed, exported: trimmed };
      })
      .filter((n): n is { exported: string; source: string } => Boolean(n));
    if (m[2] && names.length) out.push({ spec: m[2], names });
  }

  const starRe = /export\s+\*\s+from\s+['"]([^'"]+)['"]/g;
  while ((m = starRe.exec(content)) !== null) {
    if (m[1]) out.push({ spec: m[1], names: [] });
  }

  return out;
}

/** Resolve public exports for a file, following re-export chains through barrel files. */
export function buildFileExportMap(
  file: string,
  fileSymbols: ReadonlyMap<string, SymbolNode[]>,
  fileContents: ReadonlyMap<string, string>,
  knownFiles: ReadonlySet<string>,
  cache: Map<string, Map<string, ExportLocation>>,
  visiting: Set<string> = new Set(),
): Map<string, ExportLocation> {
  const cached = cache.get(file);
  if (cached) return cached;
  if (visiting.has(file)) return new Map();

  visiting.add(file);
  const map = new Map<string, ExportLocation>();

  for (const s of fileSymbols.get(file) ?? []) {
    if (s.kind === "module") continue;
    const short = s.name.split(".").pop() ?? s.name;
    map.set(short, { file, symbolName: s.name });
  }

  const content = fileContents.get(file) ?? "";
  for (const re of extractReExportsTs(content)) {
    const target = resolveImportPath(file, re.spec, knownFiles);
    if (!target) continue;
    const targetMap = buildFileExportMap(
      target,
      fileSymbols,
      fileContents,
      knownFiles,
      cache,
      visiting,
    );

    if (re.names.length === 0) {
      for (const [name, loc] of targetMap) {
        if (!map.has(name)) map.set(name, loc);
      }
    } else {
      for (const { exported, source } of re.names) {
        const loc = targetMap.get(source);
        if (loc) map.set(exported, loc);
      }
    }
  }

  visiting.delete(file);
  cache.set(file, map);
  return map;
}

/** True when a file only re-exports from other modules (typical barrel). */
export function isBarrelFile(content: string): boolean {
  const lines = content
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith("//") && !l.startsWith("/*"));
  if (lines.length === 0) return false;
  return lines.every(
    (line) =>
      /^export\s+(?:type\s+)?\{[^}]+\}\s+from\s+['"]/.test(line) ||
      /^export\s+\*\s+from\s+['"]/.test(line),
  );
}

/** Resolve a relative import spec to a repo-relative file path, or null. */
export function resolveImportPath(
  fromFile: string,
  spec: string,
  knownFiles: ReadonlySet<string>,
): string | null {
  if (!spec.startsWith(".")) return null;
  const dir = fromFile.includes("/") ? fromFile.slice(0, fromFile.lastIndexOf("/")) : "";
  const joined = normalizePath(dir ? `${dir}/${spec}` : spec);
  const base = joined.replace(/\.(tsx?|jsx?|mjs|cjs)$/, "");
  const candidates = [
    joined,
    base,
    `${base}.ts`,
    `${base}.tsx`,
    `${base}.js`,
    `${base}.jsx`,
    `${base}.mjs`,
    `${base}/index.ts`,
    `${base}/index.js`,
  ];
  for (const c of candidates) {
    if (knownFiles.has(c)) return c;
  }
  return null;
}

function normalizePath(p: string): string {
  const parts = p.split("/");
  const out: string[] = [];
  for (const part of parts) {
    if (part === "" || part === ".") continue;
    if (part === "..") out.pop();
    else out.push(part);
  }
  return out.join("/");
}

function makeNode(
  file: string,
  name: string,
  kind: SymbolNode["kind"],
  startLine: number,
  endLine: number,
  lines: string[],
): SymbolNode {
  const id = `${file}::${name}`;
  const tokens = Math.max(1, Math.ceil(lines.slice(startLine - 1, endLine).join("\n").length / 4));
  return { id, file, name, kind, startLine, endLine, tokens };
}

function findBlockEnd(lines: string[], startLine: number): number {
  const firstLine = lines[startLine - 1] ?? "";
  let bodyStartCol = 0;
  let parenDepth = 0;
  for (let i = 0; i < firstLine.length; i++) {
    const ch = firstLine[i];
    if (ch === "(") parenDepth += 1;
    else if (ch === ")") parenDepth -= 1;
    else if (ch === "{" && parenDepth === 0) {
      bodyStartCol = i;
      break;
    }
  }

  let depth = 0;
  let started = false;
  for (let i = startLine - 1; i < lines.length; i++) {
    const line = lines[i] ?? "";
    const colStart = i === startLine - 1 ? bodyStartCol : 0;
    for (let j = colStart; j < line.length; j++) {
      const ch = line[j];
      if (ch === "{") {
        depth += 1;
        started = true;
      } else if (ch === "}") {
        depth -= 1;
        if (started && depth === 0) return i + 1;
      }
    }
  }
  return Math.min(lines.length, startLine + 40);
}

function findPythonBlockEnd(lines: string[], startLine: number): number {
  const base = (lines[startLine - 1]?.match(/^(\s*)/)?.[1]?.length ?? 0);
  for (let i = startLine; i < lines.length; i++) {
    const line = lines[i] ?? "";
    if (line.trim() === "") continue;
    const indent = line.match(/^(\s*)/)?.[1]?.length ?? 0;
    if (indent <= base && line.trim()) return i;
  }
  return Math.min(lines.length, startLine + 60);
}

export function buildContainmentEdges(nodes: SymbolNode[]): SymbolEdge[] {
  const byFile = new Map<string, SymbolNode[]>();
  for (const n of nodes) {
    const list = byFile.get(n.file) ?? [];
    list.push(n);
    byFile.set(n.file, list);
  }
  const edges: SymbolEdge[] = [];
  for (const list of byFile.values()) {
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        edges.push({ from: list[i]!.id, to: list[j]!.id, kind: "contain", weight: 0.2 });
        edges.push({ from: list[j]!.id, to: list[i]!.id, kind: "contain", weight: 0.2 });
      }
    }
  }
  return edges;
}
