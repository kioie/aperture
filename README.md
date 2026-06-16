# Aperture

**Open only the code your agent needs.**

[![npm](https://img.shields.io/npm/v/aperture?color=orange)](https://www.npmjs.com/package/aperture)
[![license](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![eval](https://img.shields.io/badge/eval-6%2F6-brightgreen)](#evaluation)
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
Symbols: 12/21 · 443 tok / 4000 budget

  src/auth/login.ts        L1-8    score=0.333  54 tok
    ↳ seed: "login" matches symbol name
    ↳ seed: "validation" matches symbol name
  src/api/router.ts        L17-41  score=0.100  109 tok
    ↳ resonance: caller of login via handleLogin
  src/users/profile.ts     L11-28  score=0.000  280 tok
    ↳ resonance: attached via validateCredentials
```

**Result: 443 tokens instead of 47,000. Same quality work.**

---

## Install

```bash
npm install -g aperture
aperture doctor
```

Or zero-install with npx:

```bash
npx aperture focus "fix login validation bug" --budget 4000
```

## Quick start

```bash
# 1. Index your repo (fast — builds a symbol graph)
aperture index .

# 2. Get a cited bundle for your task
aperture focus "fix login validation bug" --budget 4000

# 3. See a beautiful tree view
aperture focus "stripe webhook payment failed" --format tree

# 4. Export as markdown for @-mentioning in Cursor
aperture focus "update user profile validation" --format markdown > .cursor/context.md

# 5. Try the built-in demo (no repo needed)
aperture demo
```

## Cursor / Claude Code / Codex

**One-command setup for Cursor:**
```bash
aperture cursor
# → prints the JSON snippet — paste into Cursor MCP settings
```

**Claude Code:**
```bash
claude mcp add aperture -- npx -y aperture mcp
```

**Any MCP client (Cursor, Claude Code, Codex, Zed...):**
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

Once connected, agents call `aperture_focus` before reading any files.

## MCP tools

| Tool | What it does |
|------|-------------|
| `aperture_focus` | Build a cited context bundle — returns file paths, line ranges, scores, reasons |
| `aperture_read_bundle` | Fetch source snippets with `path:start-end` citations |
| `aperture_explain` | Per-symbol selection rationale for debugging bad selections |

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

1. **Index** — extract symbols (functions, classes, exports) and dependency edges (imports, calls, containment) from TS/JS/Python
2. **Seed** — score symbols by token overlap between task description and symbol names/paths
3. **Resonate** — personalized propagation: high-seed symbols push score to their neighbors across the dependency graph
4. **Pack** — greedy selection by `utility = resonance × cohesion / token_cost`, stopping at budget
5. **Cite** — return file paths, line ranges, scores, and natural-language reasons

See [SPEC.md](./SPEC.md) for the full algorithm.

## Evaluation

```bash
npm run eval
```

Current score: **6/6** across auth, payments, user, and API integration tasks.

```
✓ Auth — login validation
✓ Auth — session creation
✓ Payments — webhook handler
✓ Payments — invoice billing
✓ Users — profile update validation
✓ API — router + auth integration
```

See [eval/results.md](./eval/results.md) for the full report.

## Demo

```bash
aperture demo
```

Runs Aperture on the built-in sample repo (auth + payments + users + API) and prints a formatted tree. No repo needed.

## Library API

```typescript
import { focusContext } from "aperture";

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

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). Stars help more devs find Aperture — if it's useful, give it one.

MIT License.
