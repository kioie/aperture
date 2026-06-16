import type { CodeGraph, SymbolEdge, SymbolNode } from "./types.js";

export interface AdjacencyGraph {
  nodes: string[];
  out: Map<string, Array<{ to: string; weight: number }>>;
  in: Map<string, Array<{ from: string; weight: number }>>;
}

function compareEdges(
  a: { to?: string; from?: string; weight: number },
  b: { to?: string; from?: string; weight: number },
): number {
  const aKey = a.to ?? a.from ?? "";
  const bKey = b.to ?? b.from ?? "";
  const cmp = aKey.localeCompare(bKey);
  if (cmp !== 0) return cmp;
  return a.weight - b.weight;
}

export function canonicalizeGraph(g: CodeGraph): CodeGraph {
  const nodes = new Map([...g.nodes.entries()].sort((a, b) => a[0].localeCompare(b[0])));
  const edges = [...g.edges].sort((a, b) => {
    const from = a.from.localeCompare(b.from);
    if (from !== 0) return from;
    const to = a.to.localeCompare(b.to);
    if (to !== 0) return to;
    const kind = a.kind.localeCompare(b.kind);
    if (kind !== 0) return kind;
    return a.weight - b.weight;
  });
  return { nodes, edges };
}

export function buildAdjacencyGraph(g: CodeGraph): AdjacencyGraph {
  const canonical = canonicalizeGraph(g);
  const nodes = [...canonical.nodes.keys()];
  const out = new Map<string, Array<{ to: string; weight: number }>>();
  const inn = new Map<string, Array<{ from: string; weight: number }>>();

  for (const id of nodes) {
    out.set(id, []);
    inn.set(id, []);
  }
  for (const e of canonical.edges) {
    out.get(e.from)?.push({ to: e.to, weight: e.weight });
    inn.get(e.to)?.push({ from: e.from, weight: e.weight });
  }
  for (const id of nodes) {
    out.get(id)?.sort(compareEdges);
    inn.get(id)?.sort(compareEdges);
  }
  return { nodes, out, in: inn };
}

export function mergeGraphs(parts: CodeGraph[]): CodeGraph {
  const nodes = new Map<string, SymbolNode>();
  const edges: SymbolEdge[] = [];
  for (const p of parts) {
    for (const [id, n] of p.nodes) nodes.set(id, n);
    edges.push(...p.edges);
  }
  return { nodes, edges };
}

export function outNeighbors(graph: AdjacencyGraph, id: string): string[] {
  return (graph.out.get(id) ?? []).map((e) => e.to);
}

export function inNeighbors(graph: AdjacencyGraph, id: string): string[] {
  return (graph.in.get(id) ?? []).map((e) => e.from);
}

export function allNeighbors(graph: AdjacencyGraph, id: string): string[] {
  return [...new Set([...outNeighbors(graph, id), ...inNeighbors(graph, id)])];
}
