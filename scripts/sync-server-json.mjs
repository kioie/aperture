#!/usr/bin/env node
/**
 * Sync server.json version fields from package.json (single source of truth).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const serverPath = join(root, "server.json");
const server = JSON.parse(readFileSync(serverPath, "utf8"));

const version = pkg.version;
let changed = false;

if (server.version !== version) {
  server.version = version;
  changed = true;
}

for (const p of server.packages ?? []) {
  if (p.registryType === "npm" && p.identifier === pkg.name && p.version !== version) {
    p.version = version;
    changed = true;
  }
}

if (changed) {
  writeFileSync(serverPath, JSON.stringify(server, null, 2) + "\n");
  console.log(`synced server.json → ${version}`);
} else {
  console.log(`server.json already at ${version}`);
}
