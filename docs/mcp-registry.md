# MCP Registry

Aperture ships a [`server.json`](../server.json) manifest for the [MCP Registry](https://registry.modelcontextprotocol.io).

**Registry name:** `io.github.kioie/aperture`  
**npm package:** `@kioie/aperture`

## Validate

```bash
mcp-publisher validate server.json
```

CI runs this step when `mcp-publisher` is available on the runner.

## Publish

Publishing requires the official [mcp-publisher](https://github.com/modelcontextprotocol/registry) CLI and a GitHub-authenticated login.

```bash
# One-time auth (opens browser)
mcp-publisher login

# Publish current server.json
mcp-publisher publish server.json
```

After publishing, run `npm run sync:server` (or `node scripts/sync-server-json.mjs`) so `server.json` matches `package.json` before the next release.

## Schema

Aperture uses the `2025-12-11` server.json schema with:

- npm stdio transport via `npx @kioie/aperture mcp`
- GitHub repository metadata for source verification
- `runtimeHint: npx` for package resolution

See the [schema changelog](https://github.com/modelcontextprotocol/registry/blob/main/docs/reference/server-json/CHANGELOG.md) when upgrading.
