import { describe, expect, it } from "vitest";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { focusContext } from "../../src/focus/pack.js";

const repo = join(dirname(fileURLToPath(import.meta.url)), "../fixtures/sample-repo");

describe("focusContext integration", () => {
  it("returns auth files for login task", async () => {
    const bundle = await focusContext({
      repo,
      task: "fix login validation",
      budget: 2000,
    });
    const paths = bundle.files.map((f) => f.path);
    expect(paths.some((p) => p.includes("login"))).toBe(true);
  });
});
