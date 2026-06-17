# Cursor integration

## Aperture MCP server

```bash
aperture cursor
# → prints MCP config JSON for Cursor settings
```

Or paste manually:

```json
{
  "mcpServers": {
    "aperture": {
      "command": "npx",
      "args": ["-y", "@kioie/aperture", "mcp"]
    }
  }
}
```

Restart Cursor after adding the server.

## Agent workflow

1. `aperture_focus` with the user task and repo path (budget 4000–6000 for focused tasks)
2. `aperture_read_bundle` to load cited snippets — use `path:start-end` citations when editing
3. `aperture_explain` if selection looks wrong — refine task wording and retry focus

**Do not** recursively read files before calling `aperture_focus`. The whole point is replacing grep-and-read with a budgeted bundle.

## CLI in terminal

```bash
# Tree view with selection reasons
aperture focus "implement webhook retry" --format tree

# JSON for scripts / CI
aperture focus "implement webhook retry" --json

# Markdown for @-mention in Cursor
aperture focus "implement webhook retry" --format markdown > .cursor/context.md
```

## Verify setup

```bash
aperture doctor
aperture eval   # 19/19 on built-in fixtures
aperture demo   # sample repo, no setup required
```

See also [integrations/github-action.yml](../integrations/github-action.yml) for PR context bundles.
