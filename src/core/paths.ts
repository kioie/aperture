import { existsSync, statSync } from "node:fs";
import { isAbsolute, relative, resolve } from "node:path";

/** Resolve a repository root; must exist and be a directory. */
export function resolveRepoRoot(repo: string): string {
  const abs = resolve(repo);
  if (!existsSync(abs)) {
    throw new Error(`Repository path does not exist: ${repo}`);
  }
  const stat = statSync(abs);
  if (!stat.isDirectory()) {
    throw new Error(`Repository path is not a directory: ${repo}`);
  }
  return abs;
}

/** Resolve a path relative to repoRoot; rejects traversal outside the root. */
export function resolvePathWithinRepo(repoRoot: string, relPath: string): string {
  const root = resolve(repoRoot);
  const target = resolve(root, relPath);
  const rel = relative(root, target);
  if (rel.startsWith("..") || isAbsolute(rel)) {
    throw new Error(`Path escapes repository root: ${relPath}`);
  }
  return target;
}
