# AGENTS.md — Aperture integration playbook

## Purpose

Aperture returns **token-budgeted code bundles** with file paths, line ranges, and selection reasons — before the agent reads entire files.

## Recommended workflow

1. Call `aperture_focus` with the current user goal and `budget` (start with 4000).
2. Call `aperture_read_bundle` to load cited snippets into reasoning.
3. If the agent needs more context around one file, call `aperture_focus` again with a narrower task or higher budget.
4. Call `aperture_explain` when selection looks wrong — adjust task wording and retry.

## Cursor

```bash
aperture cursor
```

Paste into Cursor MCP settings.

## Claude Code

```bash
claude mcp add aperture -- npx -y aperture mcp
```

## Budget guidance

| Work | Budget |
|------|--------|
| Localized bugfix | 3000–5000 |
| Feature spanning 2–3 modules | 5000–8000 |
| Exploration | 2000–4000 |

## Best practices

- Put the **verb + target** in the task string ("fix login validation in auth module")
- Run `aperture index .` in CI nightly to warm indexes on large repos (future cache versions)
- Prefer bundles over recursive directory reads

## Do not

- Treat bundles as exhaustive — expand budget or refine task if files are missing
- Skip citations when quoting code in PRs or reviews
