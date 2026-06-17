# Aperture

**Open only the code your agent needs.**

[![npm](https://img.shields.io/npm/v/@kioie/aperture?color=orange)](https://www.npmjs.com/package/@kioie/aperture)
[![license](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![eval](https://img.shields.io/badge/eval-19%2F19-brightgreen)](#evaluation)
[![MCP](https://img.shields.io/badge/MCP-native-purple)](docs/cursor.md)

---

> **The problem:** Your coding agent reads 40+ files before touching a single line. Token budgets blow up. Context windows fill with irrelevant code.
>
> **Aperture:** Give it a task, get back the exact symbols it needs — ranked by graph resonance, packed under your token budget, cited with file paths and line ranges.

---

## Before / After

**Before Aperture** — agent uses grep + recursive reads:
```
reading src/auth/login.ts          (2,100 tok)
reading src/auth/session.ts        (1,800 tok)
reading src/users/profile.ts       (3,200 tok)
reading src/api/router.ts          (4,500 tok)
reading src/payments/stripe.ts     (3,800 tok)
...18 more files...
Total: ~47,000 tokens consumed
```

**After Aperture** — task-targeted bundle in one call:
```
aperture focus "fix login validation bug" --budget 4000

Task: fix login validation bug
Symbols: 21/23 · 1106 tok / 4000 budget

  src/auth/login.ts        L1-8    score=0.378  54 tok
    ↳ seed: "login" matches symbol login
    ↳ seed: "login" matches symbol validateCredentials
  src/api/router.ts        L15-20  score=0.071  317 tok
    ↳ seed: "login" matches symbol handleLogin
    ↳ resonance: attached via handleLogin
```

**Result: 1,106 tokens instead of ~47,000 for this task** (sample-repo fixture; run `npx @kioie/aperture demo` to reproduce).

---

## Quick start

**Try it in 10 seconds — no install:**

```bash
npx @kioie/aperture demo
```

Runs Aperture on the built-in sample repo (auth + payments + users + API) and prints a formatted tree with exact token counts.

```bash
# Focus a task on your repo
npx @kioie/aperture focus "fix login validation bug" --budget 4000

# Index and warm the symbol graph cache
npx @kioie/aperture index .

# Environment check + next steps
npx @kioie/aperture doctor
```

**Global install (optional):**

```bash
npm install -g @kioie/aperture
aperture demo
aperture doctor
```

## Index and focus

```bash
# 1. Index your repo (fast — builds a symbol graph, cached to .aperture-cache/)
aperture index .

# 2. Get a cited bundle for your task
aperture focus "fix login validation bug" --budget 4000

# 3. See a beautiful tree view
aperture focus "stripe webhook payment failed" --format tree

# 4. Export as markdown for @-mentioning in Cursor
aperture focus "update user profile validation" --format markdown > .cursor/context.md
```

## Cursor / Claude Code / Codex

**One-command setup for Cursor:**
```bash
aperture cursor
# → prints the JSON snippet — paste into Cursor MCP settings
```

**Claude Code:**
```bash
claude mcp add aperture -- npx -y @kioie/aperture mcp
```

**Any MCP client (Cursor, Claude Code, Codex, Zed...):**
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

Once connected, agents call `aperture_focus` before reading any files.

## MCP tools

| Tool | What it does |
|------|-------------|
| `aperture_focus` | Build a cited context bundle — returns file paths, line ranges, scores, reasons |
| `aperture_read_bundle` | Fetch source snippets with `path:start-end` citations |
| `aperture_explain` | Per-symbol selection rationale for debugging bad selections |
| `aperture_index` | Index a repo and warm the cache — returns files, symbols, edges |

**Typical agent loop:**

```
1. aperture_focus(task, repo, budget=4000)
   → { files: [{ path, ranges, score, tokens, reasons }], tokens, explain }

2. aperture_read_bundle()
   → { sections: [{ path, citation: "src/auth/login.ts:1-8", content }] }

3. <edit code using citations>

4. If something looks off: aperture_explain() → adjust task wording → retry focus
```

## How it works

```
Index → Seed → Resonate → Pack → Cite
```

1. **Index** — extract symbols (functions, classes, exports) and dependency edges (imports, calls, containment) from TS/JS/Python; persist to `.aperture-cache/` for fast re-index
2. **Seed** — score symbols by token overlap between task description and symbol names/paths
3. **Resonate** — personalized propagation: high-seed symbols push score to their neighbors across the dependency graph
4. **Pack** — greedy selection by `utility = resonance × cohesion / token_cost`, stopping at budget
5. **Cite** — return file paths, line ranges, scores, and natural-language reasons

See [SPEC.md](./SPEC.md) for the full algorithm.

## Evaluation

```bash
npm run eval
```

Current score: **19/19** across sample-repo (auth, payments, users, API, barrels), monorepo (cross-package imports), and python-repo fixtures (mean recall@4000: **100%**).

```
sample-repo  — 11 cases · cold index ~26ms · disk cache ~2ms
monorepo     —  4 cases · cold index ~4ms  · disk cache ~1ms
python-repo  —  4 cases · cold index ~15ms · disk cache ~2ms
```

Reproduce: `npm run eval` or `aperture eval`.

See [eval/results.md](./eval/results.md) for the full report.

Reproducible examples with exact token counts: [EXAMPLES.md](./EXAMPLES.md).

## Demo

```bash
npx @kioie/aperture demo
```

Runs Aperture on the built-in sample repo (auth + payments + users + API) and prints a formatted tree. No repo needed.

## Library API

```typescript
import { focusContext } from "@kioie/aperture";

const bundle = await focusContext({
  repo: "/path/to/repo",
  task: "fix stripe webhook signature validation",
  budget: 4000,
});

// bundle.files = [{ path, ranges, score, tokens, reasons }]
// bundle.tokens = total tokens used
// bundle.explain = per-symbol selection reasons
```

## For AI agents

- [llms.txt](./llms.txt) — machine-readable tool docs and agent loop
- [AGENTS.md](./AGENTS.md) — full integration playbook with budget guidance
- [docs/agent-api.json](./docs/agent-api.json) — JSON schemas with example responses
- [integrations/](./integrations/) — Cursor, Claude Code, and GitHub Action configs

## MCP Registry

Publish to the [MCP Registry](https://registry.modelcontextprotocol.io) as `io.github.kioie/aperture`:

```bash
npm run sync:server              # align server.json with package.json
aperture registry validate       # schema check
mcp-publisher login              # one-time GitHub auth
aperture registry publish        # publish server.json
```

See [docs/mcp-registry.md](./docs/mcp-registry.md) for details.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

MIT License.
