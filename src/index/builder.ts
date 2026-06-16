import { readFileSync } from "node:fs";
import { join, relative } from "node:path";
import fg from "fast-glob";
import ignore from "ignore";
import {
  buildContainmentEdges,
  buildFileExportMap,
  extractCalls,
  extractNamedImportsTs,
  extractPythonSymbols,
  extractReExportsTs,
  extractTypeScriptSymbols,
  isBarrelFile,
  resolveImportPath,
  type ExportLocation,
} from "./extract.js";
import type { CodeGraph, IndexStats, SymbolEdge, SymbolNode } from "../core/types.js";

const DEFAULT_IGNORE = [
  "**/node_modules/**",
  "**/dist/**",
  "**/build/**",
  "**/.git/**",
  "**/coverage/**",
];

export interface IndexOptions {
  repo: string;
  include?: string[];
  exclude?: string[];
}

export async function indexRepository(options: IndexOptions): Promise<{
  graph: CodeGraph;
  stats: IndexStats;
}> {
  const { repo, include, exclude } = options;
  const patterns = include?.length
    ? include
    : ["**/*.{ts,tsx,js,jsx,mjs,cjs,py}"];

  const ig = ignore().add(DEFAULT_IGNORE);
  if (exclude) ig.add(exclude);

  const paths = await fg(patterns, {
    cwd: repo,
    absolute: true,
    dot: false,
  });

  const nodes = new Map<string, SymbolNode>();
  const edges: SymbolEdge[] = [];
  const nameIndex = new Map<string, string[]>();
  const fileSymbols = new Map<string, SymbolNode[]>();
  const fileImports = new Map<string, ReturnType<typeof extractNamedImportsTs>>();
  const fileContents = new Map<string, string>();

  const sortedPaths = [...paths].sort((a, b) => a.localeCompare(b));

  for (const abs of sortedPaths) {
    const rel = relative(repo, abs).replace(/\\/g, "/");
    if (ig.ignores(rel)) continue;
    let content: string;
    try {
      content = readFileSync(abs, "utf8");
    } catch {
      continue;
    }

    const symbols =
      abs.endsWith(".py")
        ? extractPythonSymbols(rel, content)
        : extractTypeScriptSymbols(rel, content);

    fileSymbols.set(rel, symbols);
    fileContents.set(rel, content);
    if (!abs.endsWith(".py")) {
      fileImports.set(rel, extractNamedImportsTs(content));
    }

    for (const s of symbols) {
      nodes.set(s.id, s);
      const list = nameIndex.get(s.name) ?? [];
      list.push(s.id);
      nameIndex.set(s.name, list);
    }

    edges.push(...buildContainmentEdges(symbols));

    const calls = extractCalls(content);
    for (const callName of calls) {
      const targets = nameIndex.get(callName) ?? [];
      for (const src of symbols) {
        for (const tgt of targets) {
          if (src.id === tgt) continue;
          edges.push({ from: src.id, to: tgt, kind: "call", weight: 1 });
        }
      }
    }
  }

  const knownFiles = new Set(fileSymbols.keys());
  const exportMapCache = new Map<string, Map<string, ExportLocation>>();

  for (const [fromFile, imports] of [...fileImports.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    const srcSymbols = fileSymbols.get(fromFile) ?? [];
    const content = fileContents.get(fromFile) ?? "";
    for (const { spec, names } of imports) {
      const targetFile = resolveImportPath(fromFile, spec, knownFiles);
      if (!targetFile) continue;
      const exportMap = buildFileExportMap(
        targetFile,
        fileSymbols,
        fileContents,
        knownFiles,
        exportMapCache,
      );
      for (const importName of names) {
        const loc = exportMap.get(importName);
        if (!loc) continue;
        const targets = resolveSymbolNodes(loc, fileSymbols);
        for (const src of srcSymbols) {
          const body = symbolBody(content, src);
          for (const tgt of targets) {
            const ref = tgt.name.split(".").pop() ?? tgt.name;
            if (src.id === tgt.id || !body.includes(ref)) continue;
            edges.push({ from: src.id, to: tgt.id, kind: "import", weight: 0.5 });
          }
        }
      }
    }
  }

  for (const [file, content] of [...fileContents.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    if (!isBarrelFile(content)) continue;
    const srcSymbols = fileSymbols.get(file) ?? [];
    const moduleNode = srcSymbols.find((s) => s.kind === "module");
    for (const re of extractReExportsTs(content)) {
      const targetFile = resolveImportPath(file, re.spec, knownFiles);
      if (!targetFile) continue;
      const exportMap = buildFileExportMap(
        targetFile,
        fileSymbols,
        fileContents,
        knownFiles,
        exportMapCache,
      );
      const bindings =
        re.names.length === 0
          ? [...exportMap.entries()].map(([exported, loc]) => ({ exported, loc }))
          : re.names
              .map(({ exported, source }) => {
                const loc = exportMap.get(exported) ?? exportMap.get(source);
                return loc ? { exported, loc } : null;
              })
              .filter((b): b is { exported: string; loc: ExportLocation } => Boolean(b));

      for (const { loc } of bindings) {
        const targets = resolveSymbolNodes(loc, fileSymbols);
        for (const src of moduleNode ? [moduleNode] : srcSymbols) {
          for (const tgt of targets) {
            if (src.id === tgt.id) continue;
            edges.push({ from: src.id, to: tgt.id, kind: "import", weight: 0.35 });
          }
        }
      }
    }
  }

  return {
    graph: { nodes, edges },
    stats: {
      files: new Set([...nodes.values()].map((n) => n.file)).size,
      symbols: nodes.size,
      edges: edges.length,
    },
  };
}

export function readBundleSnippet(
  repo: string,
  file: { path: string; ranges: Array<{ start: number; end: number }> },
): string {
  const content = readFileSync(join(repo, file.path), "utf8");
  const lines = content.split("\n");
  const chunks: string[] = [];
  for (const r of file.ranges) {
    chunks.push(lines.slice(r.start - 1, r.end).join("\n"));
  }
  return chunks.join("\n\n// ---\n\n");
}

function symbolBody(content: string, node: SymbolNode): string {
  return content.split("\n").slice(node.startLine - 1, node.endLine).join("\n");
}

function resolveSymbolNodes(
  loc: ExportLocation,
  fileSymbols: Map<string, SymbolNode[]>,
): SymbolNode[] {
  const tgtSymbols = fileSymbols.get(loc.file) ?? [];
  const exact = tgtSymbols.filter((t) => t.name === loc.symbolName);
  if (exact.length) return exact;
  const short = loc.symbolName.split(".").pop() ?? loc.symbolName;
  return tgtSymbols.filter((t) => (t.name.split(".").pop() ?? t.name) === short);
}
