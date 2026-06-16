# Aperture + Claude Code

## Install

```bash
claude mcp add aperture -- npx -y @kioie/aperture mcp
```

Or globally:
```bash
npm install -g aperture
claude mcp add aperture -- aperture mcp
```

## Verify

```bash
claude mcp list
# should show: aperture
```

## Agent loop

Once Aperture is registered, Claude Code will automatically see the three MCP tools. The recommended usage in your CLAUDE.md or project rules:

```markdown
Before reading files or running grep in this repo:
1. Call aperture_focus with your current task and budget=4000
2. Call aperture_read_bundle to load the cited snippets
3. Use the path:start-end citations in your reasoning
```

## Example CLAUDE.md snippet

```markdown
## Code context

Use Aperture before reading files:

1. `aperture_focus("your task here", budget=5000)` — get cited bundle
2. `aperture_read_bundle()` — load source content with citations
3. Work from the cited ranges; call `aperture_explain()` if selection looks wrong

Budget guide: bugfix=3000-5000, feature=5000-8000, exploration=2000-4000
```

## Zero-install for one-off use

```bash
claude "$(aperture focus 'fix login validation' --format markdown)"
```
