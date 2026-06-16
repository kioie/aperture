import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { focusContext, warmIndex, readBundleSnippet } from "../index.js";
import { getVersion } from "../version.js";

let lastRepo = process.cwd();
let lastBundle: Awaited<ReturnType<typeof focusContext>> | null = null;

export async function startApertureMcpServer(): Promise<void> {
  const version = getVersion();
  const server = new Server(
    { name: "aperture", version },
    { capabilities: { tools: {} } },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: "aperture_focus",
        description:
          "Build a token-budgeted code context bundle for a task. Call this before reading files. Returns file paths, line ranges, scores, and selection reasons.",
        inputSchema: {
          type: "object",
          properties: {
            task: { type: "string", description: "What the agent is trying to accomplish (verb + target)" },
            repo: { type: "string", description: "Absolute or relative repository root" },
            budget: { type: "number", default: 4000, description: "Token budget for the bundle" },
          },
          required: ["task"],
        },
      },
      {
        name: "aperture_read_bundle",
        description: "Read source snippets from the most recent focus bundle with path:start-end citations.",
        inputSchema: {
          type: "object",
          properties: {
            maxTokens: { type: "number", description: "Optional cap on returned text" },
          },
        },
      },
      {
        name: "aperture_explain",
        description: "Explain per-symbol selection rationale from the most recent focus call.",
        inputSchema: { type: "object", properties: {} },
      },
      {
        name: "aperture_index",
        description: "Index a repository and return symbol graph stats. Warms the cache for subsequent focus calls.",
        inputSchema: {
          type: "object",
          properties: {
            repo: { type: "string", description: "Repository root to index" },
          },
        },
      },
    ],
  }));

  server.setRequestHandler(CallToolRequestSchema, async (req) => {
    const { name, arguments: args } = req.params;
    const payload = (args ?? {}) as Record<string, unknown>;

    if (name === "aperture_focus") {
      const task = String(payload.task ?? "");
      if (!task.trim()) {
        return text({ error: "task is required — describe what the agent is trying to accomplish" });
      }
      const repo = String(payload.repo ?? lastRepo);
      lastRepo = repo;
      const budget = Number(payload.budget ?? 4000);
      lastBundle = await focusContext({ task, repo, budget });
      return text(lastBundle);
    }

    if (name === "aperture_index") {
      const repo = String(payload.repo ?? lastRepo);
      lastRepo = repo;
      const stats = await warmIndex(repo);
      return text({ repo, ...stats, cached: true });
    }

    if (name === "aperture_explain") {
      if (!lastBundle) return text({ error: "No bundle yet — call aperture_focus first" });
      const symbols = lastBundle.explain.map((entry) => {
        const [id, ...rest] = entry.split(": ");
        const reason = rest.join(": ");
        const node = id?.includes("::") ? id.split("::") : [null, id];
        return {
          id,
          file: node[0] ?? null,
          name: node[1] ?? id,
          reason,
        };
      });
      return text({
        task: lastBundle.task,
        budget: lastBundle.budget,
        tokens: lastBundle.tokens,
        symbols,
        files: lastBundle.files.map((f) => ({
          path: f.path,
          score: f.score,
          tokens: f.tokens,
          ranges: f.ranges,
          reasons: f.reasons,
        })),
      });
    }

    if (name === "aperture_read_bundle") {
      if (!lastBundle) return text({ error: "No bundle yet — call aperture_focus first" });
      const maxTokens = payload.maxTokens ? Number(payload.maxTokens) : undefined;
      let used = 0;
      const sections = [];
      for (const f of lastBundle.files) {
        const content = readBundleSnippet(lastRepo, f);
        const tokens = Math.ceil(content.length / 4);
        if (maxTokens !== undefined && used + tokens > maxTokens) break;
        used += tokens;
        sections.push({
          path: f.path,
          citation: f.ranges.map((r) => `${f.path}:${r.start}-${r.end}`).join(", "),
          content,
          tokens,
        });
      }
      return text({ sections, tokens: used });
    }

    throw new Error(`Unknown tool: ${name}`);
  });

  await server.connect(new StdioServerTransport());
}

function text(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}
