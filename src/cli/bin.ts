#!/usr/bin/env node
import { Command } from "commander";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { focusContext, indexRepository } from "../index.js";
import { readBundleSnippet } from "../index/builder.js";
import { getVersion } from "../version.js";

const program = new Command();

program
  .name("aperture")
  .description("Budget-aware code context bundles for agents")
  .version(getVersion());

program
  .command("focus")
  .description("Build a token-budgeted context bundle for a task")
  .argument("<task...>", "Task description")
  .option("-r, --repo <path>", "Repository root", process.cwd())
  .option("-b, --budget <n>", "Token budget", "4000")
  .option("-f, --format <fmt>", "plain | json | markdown | tree", "plain")
  .option("--json", "Output JSON (alias for --format json)")
  .action(async (taskParts: string[], opts: { repo: string; budget: string; format: string; json?: boolean }) => {
    const task = taskParts.join(" ");
    const bundle = await focusContext({
      repo: opts.repo,
      task,
      budget: Number(opts.budget),
    });

    const format = opts.json ? "json" : opts.format;

    if (format === "json") {
      console.log(JSON.stringify(bundle, null, 2));
      return;
    }

    if (format === "markdown") {
      console.log(renderMarkdown(opts.repo, bundle));
      return;
    }

    if (format === "tree") {
      printTree(bundle);
      return;
    }

    printPlain(bundle);
  });

program
  .command("index")
  .description("Index repository and print stats")
  .argument("[path]", "Repository root", process.cwd())
  .option("--json", "Output JSON (default)", true)
  .action(async (repo: string, opts: { json?: boolean }) => {
    const { stats } = await indexRepository({ repo });
    const payload = { repo, ...stats };
    console.log(JSON.stringify(payload, null, 2));
  });

program
  .command("doctor")
  .description("Environment self-check")
  .option("-r, --repo <path>", "Optional repo to verify indexing", "")
  .option("--json", "Output JSON")
  .action(async (opts: { repo: string; json?: boolean }) => {
    const checks: Array<{ pass: boolean; message: string }> = [];
    const line = (pass: boolean, msg: string) => {
      checks.push({ pass, message: msg });
    };

    line(/^v(2[0-9]|[3-9][0-9])/.test(process.version), `Node.js ${process.version} (>= 20 required)`);

    try {
      const { focusContext } = await import("../index.js");
      line(typeof focusContext === "function", "Aperture module loads");
    } catch (e) {
      line(false, `Aperture module loads (${e instanceof Error ? e.message : "error"})`);
    }

    if (opts.repo) {
      try {
        const { indexRepository } = await import("../index.js");
        const { stats } = await indexRepository({ repo: opts.repo });
        line(stats.symbols > 0, `Index ${opts.repo}: ${stats.files} files, ${stats.symbols} symbols, ${stats.edges} edges`);
      } catch (e) {
        line(false, `Index ${opts.repo} (${e instanceof Error ? e.message : "error"})`);
      }
    }

    const ok = checks.every((c) => c.pass);

    if (opts.json) {
      console.log(JSON.stringify({ ok, checks, version: getVersion() }, null, 2));
    } else {
      for (const c of checks) {
        console.log(c.pass ? `✓ ${c.message}` : `✗ ${c.message}`);
      }
    }

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
    const candidates = [
      join(__dirname, "../../tests/fixtures/sample-repo"),
      join(__dirname, "../../../tests/fixtures/sample-repo"),
      join(__dirname, "../../../../tests/fixtures/sample-repo"),
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
        printTreeFiles(bundle.files, "    ");
      } else if (opts.format === "json") {
        console.log(JSON.stringify(bundle, null, 2));
      } else {
        printPlain(bundle, "    ");
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
            aperture: { command: "npx", args: ["-y", "@kioie/aperture", "mcp"] },
          },
        },
        null,
        2,
      ),
    );
  });

program.parse();

function printPlain(bundle: Awaited<ReturnType<typeof focusContext>>, indent = ""): void {
  console.log(`${indent}Task: ${bundle.task}`);
  console.log(
    `${indent}Symbols: ${bundle.symbolsSelected}/${bundle.symbolsTotal} · ${bundle.tokens} tok / ${bundle.budget} budget`,
  );
  for (const f of bundle.files) {
    const ranges = f.ranges.map((r) => `${r.start}-${r.end}`).join(", ");
    console.log(`${indent}  ${f.path}  score=${f.score.toFixed(3)}  ${f.tokens} tok  lines ${ranges}`);
    if (f.reasons?.length) {
      for (const r of f.reasons.slice(0, 2)) {
        console.log(`${indent}    ↳ ${r}`);
      }
    }
  }
}

function printTree(bundle: Awaited<ReturnType<typeof focusContext>>): void {
  console.log(`Task: ${bundle.task}`);
  console.log(
    `Symbols: ${bundle.symbolsSelected}/${bundle.symbolsTotal} · ${bundle.tokens} tok / ${bundle.budget} budget`,
  );
  console.log();
  printTreeFiles(bundle.files);
}

function printTreeFiles(
  files: Awaited<ReturnType<typeof focusContext>>["files"],
  indent = "",
): void {
  for (const f of files) {
    const ranges = f.ranges.map((r) => `L${r.start}-${r.end}`).join(" ");
    const scoreBar = "▓".repeat(Math.round(f.score * 30));
    console.log(
      `${indent}\x1b[33m${f.path}\x1b[0m  ${ranges}  \x1b[2m${f.tokens}tok  score=${f.score.toFixed(3)}  ${scoreBar}\x1b[0m`,
    );
    if (f.reasons?.length) {
      for (const r of f.reasons.slice(0, 2)) {
        console.log(`${indent}  \x1b[2m↳ ${r}\x1b[0m`);
      }
    }
  }
}

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
