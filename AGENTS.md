# AGENTS.md — Aperture integration playbook

## Purpose

Aperture returns **token-budgeted code bundles** with file paths, line ranges, and selection reasons — before the agent reads entire files.

**Critical rule:** Call `aperture_focus` before any `Read`, `Grep`, or file-listing tool. This eliminates context waste and keeps you under token budget.

## Recommended workflow

```
1. aperture_focus(task, repo, budget)
   → cited bundle: files[], tokens, explain

2. aperture_read_bundle()
   → source sections with path:start-end citations

3. Edit code using cited ranges as ground truth

4. If selection looks wrong:
   → aperture_explain() to see per-symbol reasons
   → refine task string (add verb + target, e.g. "fix stripe webhook signature")
   → call aperture_focus again with higher budget or narrower task
```

## Setup

### Cursor
```bash
aperture cursor
# Prints JSON snippet — paste into Cursor MCP settings (~/.cursor/mcp.json)
```

Or add manually:
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

### Claude Code
```bash
claude mcp add aperture -- npx -y @kioie/aperture mcp
```

### Any MCP client
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

## MCP tool reference

### aperture_focus

Build a token-budgeted context bundle.

**Parameters:**
- `task` (string, required) — what the agent is trying to accomplish. Use verb + target: "fix login validation in auth module"
- `repo` (string, optional) — absolute or relative repository root (defaults to cwd)
- `budget` (number, optional, default 4000) — token budget

**Returns:**
```json
{
  "files": [
    {
      "path": "src/auth/login.ts",
      "ranges": [{ "start": 1, "end": 8 }],
      "score": 0.333,
      "tokens": 54,
      "reasons": ["seed: login matches symbol name", "seed: validation matches validateCredentials"]
    }
  ],
  "tokens": 443,
  "budget": 4000,
  "symbolsSelected": 12,
  "symbolsTotal": 21,
  "task": "fix login validation bug",
  "explain": [...]
}
```

### aperture_read_bundle

Read source snippets from the most recent bundle with line citations.

**Parameters:**
- `maxTokens` (number, optional) — cap on returned text

**Returns:**
```json
{
  "sections": [
    {
      "path": "src/auth/login.ts",
      "citation": "src/auth/login.ts:1-8",
      "content": "export async function login(user: string) ..."
    }
  ]
}
```

### aperture_explain

Explain the most recent focus selection (per-symbol reasons).

**Returns:**
```json
{
  "explain": [
    {
      "symbol": "validateCredentials",
      "file": "src/auth/login.ts",
      "score": 0.333,
      "reason": "seed: validation matches symbol name with score 1.10"
    }
  ]
}
```

## Budget guidance

| Work type | Suggested budget |
|-----------|-----------------|
| Localized bugfix | 3000–5000 |
| Feature spanning 2–3 modules | 5000–8000 |
| Exploration / understanding | 2000–4000 |
| Large refactor | 8000–12000 |

## Task string best practices

Good task strings use **verb + target + context**:

| Bad | Good |
|-----|------|
| "auth" | "fix login validation bug in auth module" |
| "payments" | "stripe webhook handler for payment_intent.failed" |
| "update profile" | "update user profile email validation and error handling" |
| "session" | "debug session creation error when credentials are invalid" |

## When aperture_focus should be skipped

- Reading a single known file by exact path (use Read directly)
- The bundle from a previous focus call already covers the current subtask
- The repo has fewer than 10 files (overhead not worth it)

## Do not

- Treat bundles as exhaustive — expand budget or refine task if expected files are missing
- Skip citations when quoting code in PRs or reviews
- Call aperture_focus repeatedly in a tight loop without changing task or budget

## Indexing

```bash
aperture index .
```

Builds the symbol graph. Fast on most repos. Run once per session; re-run after major restructuring. In CI, add `aperture index .` as a pre-step to warm the cache.

## Demo

```bash
aperture demo
```

Runs Aperture on the built-in sample repo. Good for verifying install and seeing formatted output.
