#!/usr/bin/env node
import { Command } from "commander";
import { writeFileSync } from "node:fs";
import { focusContext, indexRepository } from "../index.js";
import { readBundleSnippet } from "../index/builder.js";

const program = new Command();

program.name("aperture").description("Budget-aware code context bundles for agents").version("0.1.0");

program
  .command("focus")
  .description("Build a token-budgeted context bundle for a task")
  .argument("<task...>", "Task description")
  .option("-r, --repo <path>", "Repository root", process.cwd())
  .option("-b, --budget <n>", "Token budget", "4000")
  .option("-f, --format <fmt>", "plain | json | markdown", "plain")
  .action(async (taskParts: string[], opts: { repo: string; budget: string; format: string }) => {
    const task = taskParts.join(" ");
    const bundle = await focusContext({
      repo: opts.repo,
      task,
      budget: Number(opts.budget),
    });

    if (opts.format === "json") {
      console.log(JSON.stringify(bundle, null, 2));
      return;
    }

    if (opts.format === "markdown") {
      console.log(renderMarkdown(opts.repo, bundle));
      return;
    }

    console.log(`Task: ${bundle.task}`);
    console.log(`Symbols: ${bundle.symbolsSelected}/${bundle.symbolsTotal} · ${bundle.tokens} tok / ${bundle.budget} budget`);
    for (const f of bundle.files) {
      const ranges = f.ranges.map((r) => `${r.start}-${r.end}`).join(", ");
      console.log(`  ${f.path}  score=${f.score.toFixed(3)}  ${f.tokens} tok  lines ${ranges}`);
    }
  });

program
  .command("index")
  .description("Index repository and print stats")
  .argument("[path]", "Repository root", process.cwd())
  .action(async (repo: string) => {
    const { stats } = await indexRepository({ repo });
    console.log(JSON.stringify(stats, null, 2));
  });

program
  .command("doctor")
  .description("Environment self-check")
  .action(() => {
    const ok = /^v(2[0-9]|[3-9][0-9])/.test(process.version);
    console.log(ok ? "✓ Node.js >= 20" : "✗ Node.js 20+ required");
    process.exit(ok ? 0 : 1);
  });

program
  .command("mcp")
  .description("Run Aperture MCP server (stdio)")
  .action(async () => {
    const { startApertureMcpServer } = await import("../mcp/server.js");
    await startApertureMcpServer();
  });

program
  .command("cursor")
  .description("Print Cursor MCP config snippet")
  .action(() => {
    console.log(
      JSON.stringify(
        {
          mcpServers: {
            aperture: { command: "npx", args: ["-y", "aperture", "mcp"] },
          },
        },
        null,
        2,
      ),
    );
  });

program.parse();

function renderMarkdown(repo: string, bundle: Awaited<ReturnType<typeof focusContext>>): string {
  const parts = [`# Context bundle`, ``, `**Task:** ${bundle.task}`, ``];
  for (const f of bundle.files) {
    parts.push(`## ${f.path}`, ``);
    parts.push("```");
    parts.push(readBundleSnippet(repo, f));
    parts.push("```", ``);
  }
  return parts.join("\n");
}
