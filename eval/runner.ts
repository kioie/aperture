import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { writeFileSync } from "node:fs";
import { focusContext } from "../src/focus/pack.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repo = join(__dirname, "../tests/fixtures/sample-repo");
const BUDGET = 4000;

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
  {
    task: "validate stripe webhook signature",
    expectPathIncludes: ["stripe"],
    description: "Payments — webhook signature",
  },
  {
    task: "create invoice for user billing",
    expectPathIncludes: ["billing"],
    description: "Payments — invoice creation",
  },
  {
    task: "get user profile by id",
    expectPathIncludes: ["profile"],
    description: "Users — profile lookup",
  },
];

let hits = 0;
let recallSum = 0;
const lines = ["# Aperture eval", "", `Budget: ${BUDGET} tokens per case`, ""];

for (const c of cases) {
  const bundle = await focusContext({ repo, task: c.task, budget: BUDGET });
  const matched = c.expectPathIncludes.filter((p) => bundle.files.some((f) => f.path.includes(p)));
  const recall = matched.length / c.expectPathIncludes.length;
  const ok = matched.length > 0;
  if (ok) hits += 1;
  recallSum += recall;

  const filePaths = bundle.files.map((f) => f.path).join(", ");
  const topScore = bundle.files[0]?.score?.toFixed(3) ?? "n/a";
  lines.push(`- [${ok ? "x" : " "}] ${c.description}`);
  lines.push(`  task: "${c.task}"`);
  lines.push(`  files: ${filePaths}`);
  lines.push(
    `  tokens: ${bundle.tokens}/${bundle.budget} · top score: ${topScore} · recall@${BUDGET}: ${(recall * 100).toFixed(0)}%`,
  );
  lines.push("");
}

const avgRecall = recallSum / cases.length;
lines.push(`Score: ${hits}/${cases.length}`);
lines.push(`Mean recall@${BUDGET}: ${(avgRecall * 100).toFixed(1)}%`);

const report = lines.join("\n");
writeFileSync(join(__dirname, "results.md"), report);
console.log(report);
process.exit(hits === cases.length ? 0 : 1);
