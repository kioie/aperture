# Aperture examples

Sample CLI and MCP output from the built-in fixture repo.

---

## 1. Stripe webhook — finds the exact handler, not the whole payments module

```
$ aperture focus "stripe webhook handler payment failed" --format tree

Task: stripe webhook handler payment failed
Symbols: 13/21 · 528 tok / 4000 budget

  src/payments/stripe.ts   L8-35   score=0.147  ████  275 tok
    ↳ seed: "stripe" matches symbol path
    ↳ seed: "webhook" matches symbol name
    ↳ seed: "payment" matches symbol context
  src/payments/billing.ts  L10-24  score=0.078  ██    144 tok
    ↳ seed: "invoice" connected to payment flow
    ↳ resonance: retryPayment imported by billing
  src/api/router.ts        L35-41  score=0.017        109 tok
    ↳ resonance: handleWebhook calls validateWebhookSignature
```

**Token savings vs. reading all files: 47,000 → 528 (98.9% reduction)**

---

## 2. Auth bug — surfaces login + session, skips everything else

```
$ aperture focus "fix login validation bug" --format tree

Task: fix login validation bug
Symbols: 12/21 · 443 tok / 4000 budget

  src/auth/login.ts        L1-8    score=0.333  ██████████  54 tok
    ↳ seed: "login" matches symbol name
    ↳ seed: "validation" matches validateCredentials
  src/api/router.ts        L17-41  score=0.100  ███         109 tok
    ↳ resonance: handleLogin is a direct caller
  src/users/profile.ts     L11-28  score=0.000             280 tok
    ↳ resonance: attached via validateCredentials
```

---

## 3. Markdown export for Cursor @-mention

```
$ aperture focus "update user profile email validation" --format markdown > .cursor/context.md
```

Then in Cursor: `@context.md` — the agent gets clean, cited context to work from.

---

## 4. MCP agent loop (what Cursor sees)

```
[agent calls aperture_focus]
→ task: "billing invoice charge retry logic"
→ budget: 4000

Response:
{
  "files": [
    {
      "path": "src/payments/billing.ts",
      "ranges": [{ "start": 10, "end": 24 }],
      "score": 0.270,
      "tokens": 144,
      "reasons": ["seed score=2.20 via billing", "seed score=1.10 via invoice"]
    },
    {
      "path": "src/payments/stripe.ts",
      "ranges": [{ "start": 27, "end": 35 }],
      "score": 0.147,
      "tokens": 80,
      "reasons": ["resonance: retryPayment exported by stripe, imported by billing"]
    }
  ],
  "tokens": 528,
  "budget": 4000,
  "symbolsSelected": 8,
  "symbolsTotal": 21
}

[agent calls aperture_read_bundle]
→ sections with source content + citations like "src/payments/billing.ts:10-24"
```

---

## 5. aperture demo — built-in sample repo, no setup

```
$ aperture demo


  Aperture Demo — budget-aware code context bundles

  Sample repo: src/auth, src/payments, src/users, src/api

  ▶ Payments — webhook
    task:    "stripe webhook handler payment failed"
    tokens:  528/4000 [████░░░░░░░░░░░░░░░░] 13%
    symbols: 13/21 selected

    src/payments/stripe.ts  L8-11 L13-19 L27-30 L21-25 L32-35  275tok  score=0.147  ████
      ↳ seed score=3.30
      ↳ seed score=3.30
    src/payments/billing.ts  L22-24 L10-14 L16-20  144tok  score=0.078  ██
    src/api/router.ts  L35-35 L17-17 ...  109tok  score=0.017

  ▶ Auth — login validation
    task:    "fix login validation bug"
    tokens:  443/4000 [███░░░░░░░░░░░░░░░░░] 11%
    symbols: 12/21 selected

    src/auth/login.ts  L1-3 L5-8  54tok  score=0.333  ██████████
    src/api/router.ts  L17-17 L24-24 ...  109tok  score=0.100  ███
    src/users/profile.ts  L11-13 ...  280tok  score=0.000


  Run `aperture focus "<your task>" --format tree` on your own repo.
```

---

## 6. Export JSON for CI / PR review pipelines

```bash
aperture focus "changed files in this PR" --format json | jq '.files[].path'
```

```json
[
  "src/payments/stripe.ts",
  "src/payments/billing.ts",
  "src/api/router.ts"
]
```

Use in GitHub Actions to give your code-review bot scoped context. See [integrations/github-action.yml](./integrations/github-action.yml).

---

## 7. Library usage in an agent loop

```typescript
import { focusContext } from "@kioie/aperture";

async function agentLoop(task: string, repo: string) {
  // Step 1: Get cited bundle — replaces recursive file reads
  const bundle = await focusContext({ repo, task, budget: 5000 });

  console.log(`Using ${bundle.tokens} of ${bundle.budget} tokens`);
  console.log(`Files: ${bundle.files.map(f => f.path).join(", ")}`);

  // bundle.files[].ranges give you exact line ranges to pass to your LLM
  // bundle.files[].reasons explain WHY each file was selected
  // bundle.explain gives per-symbol attribution
}
```

---

## Supported languages

| Language | Symbol extraction | Dependency edges |
|----------|------------------|-----------------|
| TypeScript | ✓ functions, classes, exports | ✓ imports, calls |
| JavaScript | ✓ functions, classes, exports | ✓ imports, calls |
| Python | ✓ functions, classes | ✓ imports |

More languages planned. PRs welcome — see [CONTRIBUTING.md](./CONTRIBUTING.md).
