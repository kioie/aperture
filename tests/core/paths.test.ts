import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { resolvePathWithinRepo, resolveRepoRoot } from "../../src/core/paths.js";

describe("resolveRepoRoot", () => {
  it("resolves an existing directory", () => {
    const dir = mkdtempSync(join(tmpdir(), "aperture-root-"));
    expect(resolveRepoRoot(dir)).toBe(dir);
  });

  it("rejects missing paths", () => {
    expect(() => resolveRepoRoot("/nonexistent/aperture-repo-path")).toThrow(/does not exist/);
  });
});

describe("resolvePathWithinRepo", () => {
  it("allows paths inside the repo", () => {
    const dir = mkdtempSync(join(tmpdir(), "aperture-in-"));
    const file = join(dir, "src", "index.ts");
    mkdirSync(join(dir, "src"), { recursive: true });
    writeFileSync(file, "export {};\n", "utf8");
    expect(resolvePathWithinRepo(dir, "src/index.ts")).toBe(file);
  });

  it("blocks path traversal", () => {
    const dir = mkdtempSync(join(tmpdir(), "aperture-out-"));
    expect(() => resolvePathWithinRepo(dir, "../../../etc/passwd")).toThrow(/escapes repository root/);
  });
});
