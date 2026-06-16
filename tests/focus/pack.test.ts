import { afterEach, describe, expect, it, vi } from "vitest";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import * as builder from "../../src/index/builder.js";
import { clearIndexCache, focusContext, warmIndex } from "../../src/focus/pack.js";
import { clearDiskCache } from "../../src/index/builder.js";

const repo = join(dirname(fileURLToPath(import.meta.url)), "../fixtures/sample-repo");

describe("index cache", () => {
  afterEach(() => {
    clearIndexCache();
    clearDiskCache(repo);
    vi.restoreAllMocks();
  });

  it("reuses the graph on repeated focus calls for the same repo", async () => {
    const spy = vi.spyOn(builder, "indexRepository");
    clearIndexCache();

    await focusContext({ repo, task: "fix login validation", budget: 4000 });
    await focusContext({ repo, task: "stripe webhook handler", budget: 4000 });

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("warmIndex avoids re-indexing on the next focus call", async () => {
    const spy = vi.spyOn(builder, "indexRepository");
    clearIndexCache();

    await warmIndex(repo);
    await focusContext({ repo, task: "session creation error", budget: 4000 });

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("re-indexes after clearIndexCache", async () => {
    const spy = vi.spyOn(builder, "indexRepository");
    clearIndexCache();

    await focusContext({ repo, task: "fix login validation", budget: 4000 });
    clearIndexCache();
    await focusContext({ repo, task: "fix login validation", budget: 4000 });

    expect(spy).toHaveBeenCalledTimes(2);
  });
});
