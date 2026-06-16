import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { writeFileSync } from "node:fs";
import { focusContext } from "../src/focus/pack.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repo = join(__dirname, "../tests/fixtures/sample-repo");

interface Case {
  task: string;
  expectPathIncludes: string;
}

const cases: Case[] = [
  { task: "fix login validation bug", expectPathIncludes: "login" },
  { task: "session creation error", expectPathIncludes: "session" },
];

let hits = 0;
const lines = ["# Aperture eval", ""];

for (const c of cases) {
  const bundle = await focusContext({ repo, task: c.task, budget: 4000 });
  const ok = bundle.files.some((f) => f.path.includes(c.expectPathIncludes));
  if (ok) hits += 1;
  lines.push(`- [${ok ? "x" : " "}] ${c.task} → ${bundle.files.map((f) => f.path).join(", ")}`);
}

lines.push("", `Score: ${hits}/${cases.length}`);
const report = lines.join("\n");
writeFileSync(join(__dirname, "results.md"), report);
console.log(report);
process.exit(hits === cases.length ? 0 : 1);
