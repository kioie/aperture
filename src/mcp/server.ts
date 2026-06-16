import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { focusContext, readBundleSnippet } from "../index.js";

let lastRepo = process.cwd();
let lastBundle: Awaited<ReturnType<typeof focusContext>> | null = null;

export async function startApertureMcpServer(): Promise<void> {
  const server = new Server(
    { name: "aperture", version: "0.1.1" },
    { capabilities: { tools: {} } },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: "aperture_focus",
        description:
          "Build a token-budgeted code context bundle for a task. Returns file paths, line ranges, scores, and citations.",
        inputSchema: {
          type: "object",
          properties: {
            task: { type: "string", description: "What the agent is trying to accomplish" },
            repo: { type: "string", description: "Absolute or relative repository root" },
            budget: { type: "number", default: 4000 },
          },
          required: ["task"],
        },
      },
      {
        name: "aperture_explain",
        description: "Explain the most recent focus selection (per-symbol reasons).",
        inputSchema: { type: "object", properties: {} },
      },
      {
        name: "aperture_read_bundle",
        description: "Read source snippets from the most recent bundle with line citations.",
        inputSchema: {
          type: "object",
          properties: {
            maxTokens: { type: "number", description: "Optional cap on returned text" },
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
      const repo = String(payload.repo ?? lastRepo);
      lastRepo = repo;
      const budget = Number(payload.budget ?? 4000);
      lastBundle = await focusContext({ task, repo, budget });
      return text(lastBundle);
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
      const sections = lastBundle.files.map((f) => ({
        path: f.path,
        citation: f.ranges.map((r) => `${f.path}:${r.start}-${r.end}`).join(", "),
        content: readBundleSnippet(lastRepo, f),
      }));
      return text({ sections });
    }

    throw new Error(`Unknown tool: ${name}`);
  });

  await server.connect(new StdioServerTransport());
}

function text(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}
