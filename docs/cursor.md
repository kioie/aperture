# Cursor integration

## Aperture MCP server

```json
{
  "mcpServers": {
    "aperture": {
      "command": "npx",
      "args": ["-y", "aperture", "mcp"]
    }
  }
}
```

Or: `aperture cursor`

## Agent workflow

1. `aperture_focus` with the user task and repo path
2. `aperture_read_bundle` to load cited snippets
3. `aperture_explain` if selection looks wrong — refine task and retry

## CLI in terminal

```bash
aperture focus "implement webhook retry" --format markdown > .cursor/context.md
```

Reference the bundle in your prompt or `@` mention the generated file in Cursor.
