# Contributing to Aperture

Thanks for your interest! Aperture is a small, focused tool — contributions that keep it sharp are most welcome.

---

## What we're looking for

### High value
- **Language support** — Python is partially done; Go, Rust, Ruby parsers would be impactful
- **Eval fixtures** — more sample repos covering real-world patterns (monorepos, mixed-language, large repos)
- **MCP integrations** — integrations with Zed, Windsurf, or other MCP-capable editors
- **Performance** — indexing speed improvements for large repos (50k+ files)
- **Bug reports** — especially wrong-selection cases; include the task string and expected files

### Medium value
- CLI UX improvements (better tree formatting, color themes)
- Additional `--format` options (YAML, CSV for CI pipelines)
- `aperture watch` for incremental re-indexing

### Lower priority
- Full LSP/type-resolution integration (planned for v0.2+)
- Remote repository indexing
- Automatic patch generation (out of scope)

---

## Development setup

```bash
git clone https://github.com/kioie/aperture
cd aperture
npm install
npm test          # unit + integration tests
npm run eval      # evaluation suite (6/6 cases)
npm run build     # TypeScript compile
```

## Project structure

```
src/
  cli/bin.ts          — CLI commands (focus, index, demo, cursor, mcp)
  core/
    resonance.ts      — seed scoring + graph propagation
    cohesion-pack.ts  — greedy bundle packing algorithm
    graph.ts          — symbol graph construction
    tokenizer.ts      — token counting
    types.ts          — shared types
  index/
    builder.ts        — repository indexing, symbol extraction
    extract.ts        — language-specific symbol extractors
  focus/pack.ts       — focusContext() — the main entry point
  mcp/server.ts       — MCP server (aperture_focus, aperture_read_bundle, aperture_explain)
tests/
  fixtures/sample-repo/   — sample TypeScript repo for eval and tests
  core/cohesion.test.ts
  index/extract.test.ts
  integration/focus.test.ts
eval/runner.ts          — 6-case evaluation suite
```

## Adding a new language

1. Add a parser in `src/index/extract.ts` (see the TypeScript extractor as a template)
2. Add fixture files in `tests/fixtures/sample-repo/src/<new-lang>/`
3. Add eval cases in `eval/runner.ts`
4. Run `npm run eval` — score should stay at 6/6 (or improve)

## Adding eval cases

1. Add fixture files to `tests/fixtures/sample-repo/src/`
2. Add a case to `eval/runner.ts`
3. Run `npm run eval` — confirm it passes
4. Update `eval/results.md` by committing the output

## Submitting a PR

- `npm test` must pass
- `npm run eval` must pass (score >= current)
- Keep PRs focused — one feature or fix per PR
- No AI-generated comments explaining what the code does

## Code style

- TypeScript strict mode
- No classes where functions suffice
- Exported types in `src/core/types.ts`
- Keep the core algorithm (resonance + cohesion-pack) pure and testable

---

## Reporting wrong selections

Aperture's quality is only as good as its eval fixtures. If you see a task where the wrong files come back:

1. Run `aperture focus "<task>" --format json` and save the output
2. Run `aperture explain` to see why those symbols scored high
3. Open an issue with: task string, expected files, actual files, and the explain output

This is the most valuable contribution you can make.
