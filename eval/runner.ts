import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { writeFileSync } from "node:fs";
import { performance } from "node:perf_hooks";
import { focusContext, clearIndexCache } from "../src/focus/pack.js";
import { clearDiskCache, indexRepository } from "../src/index/builder.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const sampleRepo = join(__dirname, "../tests/fixtures/sample-repo");
const monorepo = join(__dirname, "../tests/fixtures/monorepo");
const pythonRepo = join(__dirname, "../tests/fixtures/python-repo");
const BUDGET = Number(process.env.APERTURE_EVAL_BUDGET) || 4000;

interface Case {
  task: string;
  expectPathIncludes: string[];
  description: string;
}

interface Suite {
  name: string;
  repo: string;
  cases: Case[];
}

const suites: Suite[] = [
  {
    name: "sample-repo",
    repo: sampleRepo,
    cases: [
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
      {
        task: "auth barrel re-export login flow",
        expectPathIncludes: ["login", "index"],
        description: "Auth — barrel index re-exports",
      },
      {
        task: "payments barrel re-export stripe billing",
        expectPathIncludes: ["stripe", "index"],
        description: "Payments — barrel index re-exports",
      },
    ],
  },
  {
    name: "monorepo",
    repo: monorepo,
    cases: [
      {
        task: "cross-package login handler in api server",
        expectPathIncludes: ["login", "server"],
        description: "Monorepo — cross-package auth login",
      },
      {
        task: "shared email validation utility",
        expectPathIncludes: ["validate"],
        description: "Monorepo — shared validation package",
      },
      {
        task: "stripe webhook handler in api app",
        expectPathIncludes: ["stripe", "server"],
        description: "Monorepo — payments webhook via packages",
      },
      {
        task: "retry failed billing charge invoice",
        expectPathIncludes: ["billing"],
        description: "Monorepo — billing retry across packages",
      },
    ],
  },
  {
    name: "python-repo",
    repo: pythonRepo,
    cases: [
      {
        task: "fix login validation bug",
        expectPathIncludes: ["login"],
        description: "Python — login validation",
      },
      {
        task: "stripe webhook handler payment failed",
        expectPathIncludes: ["stripe"],
        description: "Python — webhook handler",
      },
      {
        task: "update user profile email validation",
        expectPathIncludes: ["profile"],
        description: "Python — profile validation",
      },
      {
        task: "retry failed billing charge invoice",
        expectPathIncludes: ["billing"],
        description: "Python — billing retry",
      },
    ],
  },
];

let hits = 0;
let totalCases = 0;
let recallSum = 0;
const lines = ["# Aperture eval", "", `Budget: ${BUDGET} tokens per case`, ""];

for (const suite of suites) {
  clearIndexCache();
  clearDiskCache(suite.repo);

  const coldStart = performance.now();
  await indexRepository({ repo: suite.repo });
  const coldMs = performance.now() - coldStart;

  clearIndexCache();
  const warmStart = performance.now();
  await indexRepository({ repo: suite.repo });
  const warmMs = performance.now() - warmStart;

  lines.push(`## ${suite.name}`);
  lines.push(`Index: cold ${coldMs.toFixed(0)}ms · disk cache ${warmMs.toFixed(0)}ms`);
  lines.push("");

  for (const c of suite.cases) {
    totalCases += 1;
    const bundle = await focusContext({ repo: suite.repo, task: c.task, budget: BUDGET });
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
}

const avgRecall = recallSum / totalCases;
lines.push(`Score: ${hits}/${totalCases}`);
lines.push(`Mean recall@${BUDGET}: ${(avgRecall * 100).toFixed(1)}%`);

const report = lines.join("\n");
writeFileSync(join(__dirname, "results.md"), report);
console.log(report);
process.exit(hits === totalCases ? 0 : 1);
