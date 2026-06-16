import { readFileSync } from "node:fs";
import { join, relative } from "node:path";
import fg from "fast-glob";
import ignore from "ignore";
import {
  buildContainmentEdges,
  extractCalls,
  extractPythonSymbols,
  extractTypeScriptSymbols,
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
