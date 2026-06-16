import { describe, expect, it } from "vitest";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { indexRepository } from "../../src/index/builder.js";
import { focusContext, clearIndexCache } from "../../src/focus/pack.js";

const repo = join(dirname(fileURLToPath(import.meta.url)), "../fixtures/sample-repo");

describe("indexRepository", () => {
  it("indexes files in stable order", async () => {
    const a = await indexRepository({ repo });
    const b = await indexRepository({ repo });
    expect(a.stats).toEqual(b.stats);
  });
});

describe("focusContext determinism", () => {
  it("returns the same bundle for repeated runs", async () => {
    clearIndexCache();
    const first = await focusContext({ repo, task: "fix login validation bug", budget: 4000 });
    clearIndexCache();
    const second = await focusContext({ repo, task: "fix login validation bug", budget: 4000 });
    expect(second.tokens).toBe(first.tokens);
    expect(second.symbolsSelected).toBe(first.symbolsSelected);
    expect(second.files.map((f) => f.path)).toEqual(first.files.map((f) => f.path));
  });
});
