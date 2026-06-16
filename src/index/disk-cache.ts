import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { CodeGraph, IndexStats, SymbolEdge, SymbolNode } from "../core/types.js";

const CACHE_VERSION = 1;
const CACHE_DIR = ".aperture-cache";
const CACHE_FILE = "index.json";

interface SerializedGraph {
  version: number;
  fingerprint: string;
  stats: IndexStats;
  nodes: SymbolNode[];
  edges: SymbolEdge[];
}

export function diskCachePath(repo: string): string {
  return join(repo, CACHE_DIR, CACHE_FILE);
}

export function computeFingerprint(repo: string, relPaths: string[]): string {
  const hash = createHash("sha256");
  for (const rel of [...relPaths].sort((a, b) => a.localeCompare(b))) {
    const abs = join(repo, rel);
    try {
      const st = statSync(abs);
      hash.update(`${rel}\0${st.mtimeMs}\0${st.size}\n`);
    } catch {
      hash.update(`${rel}\0missing\n`);
    }
  }
  return hash.digest("hex");
}

export function loadDiskCache(
  repo: string,
  fingerprint: string,
): { graph: CodeGraph; stats: IndexStats } | null {
  const path = diskCachePath(repo);
  if (!existsSync(path)) return null;

  try {
    const raw = JSON.parse(readFileSync(path, "utf8")) as SerializedGraph;
    if (raw.version !== CACHE_VERSION || raw.fingerprint !== fingerprint) return null;

    const nodes = new Map<string, SymbolNode>();
    for (const node of raw.nodes) nodes.set(node.id, node);
    return { graph: { nodes, edges: raw.edges }, stats: raw.stats };
  } catch {
    return null;
  }
}

export function saveDiskCache(
  repo: string,
  fingerprint: string,
  graph: CodeGraph,
  stats: IndexStats,
): void {
  const dir = join(repo, CACHE_DIR);
  mkdirSync(dir, { recursive: true });

  const payload: SerializedGraph = {
    version: CACHE_VERSION,
    fingerprint,
    stats,
    nodes: [...graph.nodes.values()],
    edges: graph.edges,
  };

  writeFileSync(diskCachePath(repo), JSON.stringify(payload));
}

export function clearDiskCache(repo: string): void {
  const path = diskCachePath(repo);
  if (existsSync(path)) unlinkSync(path);
}
