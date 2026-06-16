import { allNeighbors } from "./graph.js";
import type { AdjacencyGraph } from "./graph.js";
import type { BundleFile, FocusBundle, SymbolNode } from "./types.js";
import { tokenizeTask } from "./resonance.js";

export interface PackInput {
  graph: AdjacencyGraph;
  ranks: Map<string, number>;
  seeds: Map<string, number>;
  nodes: Map<string, SymbolNode>;
  budget: number;
  task: string;
}

export function cohesionPack(input: PackInput): FocusBundle {
  const { graph, ranks, seeds, nodes, budget, task } = input;
  const selected = new Set<string>();
  const reasons = new Map<string, string>();
  const taskTokens = tokenizeTask(task);

  for (const [id, s] of [...seeds.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8)) {
    selected.add(id);
    reasons.set(id, seedReason(id, nodes, taskTokens, s));
  }

  let used = tokenSum(selected, nodes);

  while (used < budget) {
    let best: { id: string; utility: number } | null = null;
    for (const id of graph.nodes) {
      if (selected.has(id)) continue;
      const node = nodes.get(id);
      if (!node) continue;
      const cost = node.tokens;
      if (used + cost > budget) continue;
      const attachment = attachmentRatio(graph, id, selected);
      if (attachment <= 0 && selected.size > 0) continue;
      const rank = ranks.get(id) ?? 0;
      const utility = (rank * attachment) / Math.max(1, cost);
      if (!best || utility > best.utility) best = { id, utility };
    }
    if (!best || best.utility <= 0) break;
    selected.add(best.id);
    reasons.set(best.id, resonanceReason(graph, best.id, selected, nodes));
    used = tokenSum(selected, nodes);
  }

  const files = collapseToFiles(selected, nodes, ranks, reasons);
  const explain = [...selected].map((id) => {
    const node = nodes.get(id);
    const label = node ? `${node.file}::${node.name}` : id;
    return `${label}: ${reasons.get(id) ?? ""}`;
  });

  return {
    task,
    budget,
    files,
    tokens: files.reduce((s, f) => s + f.tokens, 0),
    symbolsSelected: selected.size,
    symbolsTotal: nodes.size,
    explain,
  };
}

function attachmentRatio(graph: AdjacencyGraph, id: string, selected: Set<string>): number {
  if (selected.size === 0) return 1;
  const neighbors = allNeighbors(graph, id);
  if (neighbors.length === 0) return 0;
  let hits = 0;
  for (const n of neighbors) if (selected.has(n)) hits += 1;
  return hits / neighbors.length;
}

function seedReason(
  id: string,
  nodes: Map<string, SymbolNode>,
  taskTokens: string[],
  score: number,
): string {
  const node = nodes.get(id);
  if (!node) return `seed score=${score.toFixed(2)}`;
  const hay = `${node.name} ${node.file}`.toLowerCase();
  const matched = taskTokens.filter((t) => hay.includes(t));
  if (matched.length === 0) return `seed: task overlap score=${score.toFixed(2)} on ${node.name}`;
  return `seed: "${matched.join('", "')}" matches symbol ${node.name}`;
}

function resonanceReason(
  graph: AdjacencyGraph,
  id: string,
  selected: Set<string>,
  nodes: Map<string, SymbolNode>,
): string {
  const node = nodes.get(id);
  const neighbors = allNeighbors(graph, id);
  for (const n of neighbors) {
    if (!selected.has(n) || n === id) continue;
    const via = nodes.get(n);
    if (via) return `resonance: attached via ${via.name} in ${via.file}`;
  }
  return node ? `resonance: graph neighbor of selected bundle (${node.name})` : "resonance: graph attachment";
}

function tokenSum(selected: Set<string>, nodes: Map<string, SymbolNode>): number {
  let t = 0;
  for (const id of selected) t += nodes.get(id)?.tokens ?? 0;
  return t;
}

function collapseToFiles(
  selected: Set<string>,
  nodes: Map<string, SymbolNode>,
  ranks: Map<string, number>,
  reasons: Map<string, string>,
): BundleFile[] {
  const byFile = new Map<string, BundleFile>();
  for (const id of selected) {
    const node = nodes.get(id);
    if (!node) continue;
    let file = byFile.get(node.file);
    if (!file) {
      file = {
        path: node.file,
        score: 0,
        tokens: 0,
        ranges: [],
        reasons: [],
      };
      byFile.set(node.file, file);
    }
    file.score = Math.max(file.score, ranks.get(id) ?? 0);
    file.tokens += node.tokens;
    file.ranges.push({ start: node.startLine, end: node.endLine });
    file.reasons.push(reasons.get(id) ?? "");
  }
  return [...byFile.values()].sort((a, b) => b.score - a.score);
}
