import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { writeFileSync } from "node:fs";
import { focusContext } from "../src/focus/pack.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repo = join(__dirname, "../tests/fixtures/sample-repo");

interface Case {
  task: string;
  expectPathIncludes: string[];
  description: string;
}

const cases: Case[] = [
  {
    task: "fix login validation bug",
    expectPathIncludes: ["login"],
    description: "Auth — login validation",
  },
  {
    task: "session creation error",
    expectPathIncludes: ["session"],
    description: "Auth — session creation",
  },
  {
    task: "stripe webhook handler payment failed",
    expectPathIncludes: ["stripe"],
    description: "Payments — webhook handler",
  },
  {
    task: "billing invoice charge retry logic",
    expectPathIncludes: ["billing"],
    description: "Payments — invoice billing",
  },
  {
    task: "update user profile email validation",
    expectPathIncludes: ["profile"],
    description: "Users — profile update validation",
  },
  {
    task: "API route for user login and session",
    expectPathIncludes: ["router", "login"],
    description: "API — router + auth integration",
  },
];

let hits = 0;
const lines = ["# Aperture eval", ""];
const details: string[] = [];

for (const c of cases) {
  const bundle = await focusContext({ repo, task: c.task, budget: 4000 });
  const ok = c.expectPathIncludes.some((p) => bundle.files.some((f) => f.path.includes(p)));
  if (ok) hits += 1;
  const filePaths = bundle.files.map((f) => f.path).join(", ");
  const topScore = bundle.files[0]?.score?.toFixed(3) ?? "n/a";
  lines.push(`- [${ok ? "x" : " "}] ${c.description}`);
  lines.push(`  task: "${c.task}"`);
  lines.push(`  files: ${filePaths}`);
  lines.push(`  tokens: ${bundle.tokens}/${bundle.budget} · top score: ${topScore}`);
  lines.push("");
}

lines.push(`Score: ${hits}/${cases.length}`);
const report = lines.join("\n");
writeFileSync(join(__dirname, "results.md"), report);
console.log(report);
process.exit(hits === cases.length ? 0 : 1);
