import { describe, expect, it } from "vitest";
import { scoreSeeds, computeResonance, tokenizeTask } from "../../src/core/resonance.js";
import { buildAdjacencyGraph } from "../../src/core/graph.js";
import { cohesionPack } from "../../src/core/cohesion-pack.js";
import type { CodeGraph, SymbolNode } from "../../src/core/types.js";

function sampleGraph(): CodeGraph {
  const nodes = new Map<string, SymbolNode>([
    ["a.ts::login", { id: "a.ts::login", file: "a.ts", name: "login", kind: "function", startLine: 1, endLine: 10, tokens: 100 }],
    ["a.ts::validate", { id: "a.ts::validate", file: "a.ts", name: "validate", kind: "function", startLine: 11, endLine: 25, tokens: 80 }],
    ["b.ts::session", { id: "b.ts::session", file: "b.ts", name: "session", kind: "function", startLine: 1, endLine: 15, tokens: 90 }],
    ["c.ts::ui", { id: "c.ts::ui", file: "c.ts", name: "ui", kind: "function", startLine: 1, endLine: 20, tokens: 120 }],
  ]);
  const edges = [
    { from: "a.ts::login", to: "a.ts::validate", kind: "call" as const, weight: 1 },
    { from: "a.ts::login", to: "b.ts::session", kind: "call" as const, weight: 1 },
    { from: "a.ts::validate", to: "a.ts::login", kind: "contain" as const, weight: 0.2 },
  ];
  return { nodes, edges };
}

describe("tokenizeTask", () => {
  it("extracts meaningful tokens", () => {
    expect(tokenizeTask("fix login validation bug")).toContain("login");
  });
});

describe("scoreSeeds", () => {
  it("prefers matching symbols", () => {
    const g = sampleGraph();
    const seeds = scoreSeeds("fix login validation", g.nodes.values());
    expect(seeds.get("a.ts::login")).toBeGreaterThan(seeds.get("c.ts::ui") ?? 0);
  });
});

describe("cohesionPack", () => {
  it("respects budget and includes seeds", () => {
    const g = sampleGraph();
    const graph = buildAdjacencyGraph(g);
    const seeds = scoreSeeds("login session", g.nodes.values());
    const ranks = computeResonance(graph, seeds);
    const bundle = cohesionPack({
      graph,
      ranks,
      seeds,
      nodes: g.nodes,
      budget: 250,
      task: "login session",
    });
    expect(bundle.tokens).toBeLessThanOrEqual(250);
    expect(bundle.symbolsSelected).toBeGreaterThan(0);
    expect(bundle.files.some((f) => f.path === "a.ts")).toBe(true);
  });
});
