# Aperture specification

## Problem

Agents over-read codebases (whole files, broad grep) or under-read (miss callers and dependencies).

## Approach — cohesion packing

1. **Index** symbols and edges (imports, calls, same-file containment)
2. **Seed** symbols from task token overlap on names and paths
3. **Resonate** scores via personalized propagation on the dependency graph
4. **Pack** greedily by utility = resonance × attachment / token_cost subject to budget
5. **Attach constraint** — prefer symbols connected to the growing bundle (cohesion)

## Outputs

- `files[]` with `ranges[]`, `score`, `tokens`, `reasons[]`
- `explain[]` per selected symbol

## Languages (v0.1)

TypeScript, JavaScript, Python via lightweight structural extraction.

## Non-goals (v0.1)

- Full type-system resolution (planned: optional LSP adapters)
- Remote repository indexing
- Automatic patch generation

## Evaluation

`eval/runner.ts` and `tests/fixtures/sample-repo/`
