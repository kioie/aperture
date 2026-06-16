#!/usr/bin/env node
import { Command } from "commander";
import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
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
  .command("demo")
  .description("Run Aperture on the built-in sample repo and display a formatted bundle")
  .option("-f, --format <fmt>", "plain | json | markdown | tree", "tree")
  .action(async (opts: { format: string }) => {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    // resolve sample-repo relative to the installed package
    const candidates = [
      join(__dirname, "../../tests/fixtures/sample-repo"),
      join(__dirname, "../../../tests/fixtures/sample-repo"),
    ];
    const { existsSync } = await import("node:fs");
    const repo = candidates.find((p) => existsSync(p)) ?? (candidates[0] as string);

    const tasks = [
      { task: "stripe webhook handler payment failed", label: "Payments — webhook" },
      { task: "fix login validation bug", label: "Auth — login validation" },
      { task: "update user profile email validation", label: "Users — profile" },
    ];

    console.log("\n\x1b[1m\x1b[36m  Aperture Demo\x1b[0m — budget-aware code context bundles\n");
    console.log("  Sample repo: src/auth, src/payments, src/users, src/api\n");

    for (const { task, label } of tasks) {
      const bundle = await focusContext({ repo, task, budget: 4000 });
      const pct = Math.round((bundle.tokens / bundle.budget) * 100);
      const bar = "█".repeat(Math.round(pct / 5)) + "░".repeat(20 - Math.round(pct / 5));

      console.log(`\x1b[1m  ▶ ${label}\x1b[0m`);
      console.log(`    task:    "${task}"`);
      console.log(`    tokens:  ${bundle.tokens}/${bundle.budget} [${bar}] ${pct}%`);
      console.log(`    symbols: ${bundle.symbolsSelected}/${bundle.symbolsTotal} selected`);
      console.log();

      if (opts.format === "tree") {
        for (const f of bundle.files) {
          const ranges = f.ranges.map((r) => `L${r.start}-${r.end}`).join(" ");
          const scoreBar = "▓".repeat(Math.round(f.score * 30));
          console.log(`    \x1b[33m${f.path}\x1b[0m  ${ranges}  \x1b[2m${f.tokens}tok  score=${f.score.toFixed(3)}  ${scoreBar}\x1b[0m`);
          if (f.reasons?.length) {
            for (const r of f.reasons.slice(0, 2)) {
              console.log(`      \x1b[2m↳ ${r}\x1b[0m`);
            }
          }
        }
      } else {
        for (const f of bundle.files) {
          const ranges = f.ranges.map((r) => `${r.start}-${r.end}`).join(", ");
          console.log(`    ${f.path}  score=${f.score.toFixed(3)}  ${f.tokens} tok  lines ${ranges}`);
        }
      }
      console.log();
    }

    console.log("  \x1b[2mRun `aperture focus \"<your task>\" --format tree` on your own repo.\x1b[0m\n");
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
