import type { AdjacencyGraph } from "./graph.js";
import type { SymbolNode } from "./types.js";

const STOP = new Set(["the", "and", "for", "with", "from", "this", "that", "fix", "bug"]);

export function tokenizeTask(task: string): string[] {
  return task
    .toLowerCase()
    .split(/[^a-z0-9_]+/)
    .filter((t) => t.length > 2 && !STOP.has(t));
}

export function scoreSeeds(task: string, nodes: Iterable<SymbolNode>): Map<string, number> {
  const tokens = tokenizeTask(task);
  const scores = new Map<string, number>();
  for (const node of nodes) {
    const hay = `${node.name} ${node.file}`.toLowerCase();
    let score = 0;
    for (const t of tokens) {
      if (hay.includes(t)) score += 1;
      else if (t.length > 4 && hay.split(/[^a-z0-9]+/).some((p) => p.includes(t))) score += 0.5;
    }
    if (node.kind === "function" || node.kind === "method") score *= 1.1;
    if (score > 0) scores.set(node.id, score);
  }
  return scores;
}

/** Personalized resonance propagation (PageRank with seed restart). */
export function computeResonance(
  graph: AdjacencyGraph,
  seeds: Map<string, number>,
  alpha = 0.85,
  iterations = 40,
): Map<string, number> {
  const nodes = graph.nodes;
  const n = nodes.length;
  if (n === 0) return new Map();

  const seedMass = [...seeds.values()].reduce((a, b) => a + b, 0) || 1;
  const restart = new Map<string, number>();
  for (const id of nodes) {
    restart.set(id, (seeds.get(id) ?? 0) / seedMass);
  }

  let rank = new Map<string, number>();
  for (const id of nodes) rank.set(id, 1 / n);

  for (let iter = 0; iter < iterations; iter++) {
    const next = new Map<string, number>();
    for (const id of nodes) next.set(id, (1 - alpha) * (restart.get(id) ?? 0));

    for (const id of nodes) {
      const outEdges = graph.out.get(id) ?? [];
      if (outEdges.length === 0) continue;
      const share = (rank.get(id) ?? 0) * alpha / outEdges.length;
      for (const e of outEdges) {
        next.set(e.to, (next.get(e.to) ?? 0) + share);
      }
    }
    rank = next;
  }
  return rank;
}
