import { afterEach, describe, expect, it } from "vitest";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import { indexRepository, clearDiskCache } from "../../src/index/builder.js";
import { clearIndexCache } from "../../src/focus/pack.js";
import { diskCachePath } from "../../src/index/disk-cache.js";

const repo = join(dirname(fileURLToPath(import.meta.url)), "../fixtures/sample-repo");

describe.sequential("disk index cache", () => {
  afterEach(() => {
    clearIndexCache();
    clearDiskCache(repo);
  });

  it("writes cache file after indexing", async () => {
    clearDiskCache(repo);
    await indexRepository({ repo });
    expect(existsSync(diskCachePath(repo))).toBe(true);
  });

  it("loads graph from disk on second index when files unchanged", async () => {
    clearDiskCache(repo);
    const first = await indexRepository({ repo });
    clearIndexCache();

    const second = await indexRepository({ repo });
    expect(second.stats).toEqual(first.stats);
    expect(second.graph.edges.length).toBe(first.graph.edges.length);
  });

  it("invalidates cache when a source file changes", async () => {
    clearDiskCache(repo);
    await indexRepository({ repo });

    const { readFileSync, writeFileSync } = await import("node:fs");
    const touch = join(repo, "src/auth/login.ts");
    const original = readFileSync(touch, "utf8");
    writeFileSync(touch, `${original}\nexport function cacheBustToken() {}\n`);

    try {
      clearIndexCache();
      const before = readFileSync(diskCachePath(repo), "utf8");
      await indexRepository({ repo });
      const after = readFileSync(diskCachePath(repo), "utf8");
      expect(after).not.toBe(before);
    } finally {
      writeFileSync(touch, original);
      clearDiskCache(repo);
    }
  });

  it("skips disk cache when useDiskCache is false", async () => {
    clearDiskCache(repo);
    await indexRepository({ repo, useDiskCache: false });
    expect(existsSync(diskCachePath(repo))).toBe(false);
  });
});

describe("monorepo fixture", () => {
  const monorepo = join(dirname(fileURLToPath(import.meta.url)), "../fixtures/monorepo");

  afterEach(() => {
    clearIndexCache();
    clearDiskCache(monorepo);
  });

  it("indexes cross-package imports", async () => {
    const { graph } = await indexRepository({ repo: monorepo });
    const importEdges = graph.edges.filter((e) => e.kind === "import");
    expect(importEdges.some((e) => e.from.includes("server") && e.to.includes("login"))).toBe(true);
  });

  it("resolves imports through package barrel files", async () => {
    const { graph } = await indexRepository({ repo: monorepo });
    const barrelEdges = graph.edges.filter(
      (e) => e.kind === "import" && (e.from.includes("server") || e.to.includes("stripe")),
    );
    expect(barrelEdges.length).toBeGreaterThan(0);
  });
});
