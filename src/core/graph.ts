import type { CodeGraph, SymbolEdge, SymbolNode } from "./types.js";

export interface AdjacencyGraph {
  nodes: string[];
  out: Map<string, Array<{ to: string; weight: number }>>;
  in: Map<string, Array<{ from: string; weight: number }>>;
}

export function buildAdjacencyGraph(g: CodeGraph): AdjacencyGraph {
  const nodes = [...g.nodes.keys()];
  const out = new Map<string, Array<{ to: string; weight: number }>>();
  const inn = new Map<string, Array<{ from: string; weight: number }>>();

  for (const id of nodes) {
    out.set(id, []);
    inn.set(id, []);
  }
  for (const e of g.edges) {
    out.get(e.from)?.push({ to: e.to, weight: e.weight });
    inn.get(e.to)?.push({ from: e.from, weight: e.weight });
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
