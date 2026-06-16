import { buildAdjacencyGraph } from "../core/graph.js";
import { cohesionPack } from "../core/cohesion-pack.js";
import { computeResonance, scoreSeeds } from "../core/resonance.js";
import type { FocusBundle, FocusOptions, IndexStats } from "../core/types.js";
import { indexRepository } from "../index/builder.js";

let cached: { repo: string; graph: Awaited<ReturnType<typeof indexRepository>>["graph"] } | null =
  null;

export async function focusContext(options: FocusOptions): Promise<FocusBundle> {
  const graphData =
    cached?.repo === options.repo
      ? cached.graph
      : (await indexRepository(options)).graph;
  cached = { repo: options.repo, graph: graphData };

  const seeds = scoreSeeds(options.task, graphData.nodes.values());
  const graph = buildAdjacencyGraph(graphData);
  const ranks = computeResonance(graph, seeds);

  return cohesionPack({
    graph,
    ranks,
    seeds,
    nodes: graphData.nodes,
    budget: options.budget,
    task: options.task,
  });
}

export async function warmIndex(repo: string): Promise<IndexStats> {
  const { graph, stats } = await indexRepository({ repo });
  cached = { repo, graph };
  return stats;
}

export function clearIndexCache(): void {
  cached = null;
}
