# Aperture

**Budget-aware code context bundles for coding agents.**

Aperture opens only the code your agent needs — symbol graph, resonance scoring, cohesion packing under a token budget. MCP-native and Cursor-ready.

## Install

```bash
npm install -g aperture
aperture doctor
```

## Quick start

```bash
aperture index .
aperture focus "fix login validation bug" --budget 4000
aperture focus "fix login validation bug" --format markdown > context.md
```

## Cursor / Claude Code

```bash
aperture cursor
# or
claude mcp add aperture -- npx -y aperture mcp
```

## MCP tools

| Tool | Purpose |
|------|---------|
| `aperture_focus` | Build a cited context bundle for a task |
| `aperture_explain` | Per-symbol selection rationale |
| `aperture_read_bundle` | Fetch source snippets with citations |

## How it works

1. **Index** — extract symbols and dependency edges from TS/JS/Python
2. **Seed** — score symbols against the task
3. **Resonate** — personalized propagation across the graph
4. **Pack** — greedy cohesion selection under token budget
5. **Cite** — return file paths and line ranges

## Evaluation

```bash
npm run eval
```

## For AI agents

See [llms.txt](./llms.txt) and [AGENTS.md](./AGENTS.md).

MIT License.
