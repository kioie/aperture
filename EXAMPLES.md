# Aperture examples

Reproducible numbers from the built-in sample repo (`tests/fixtures/sample-repo`).
Run these locally — output should match eval within a few tokens.

## Before / after (login validation)

**Without Aperture** — naive agent reads every file in the sample repo:

| File | Approx. tokens |
|------|----------------|
| src/auth/login.ts | 54 |
| src/auth/session.ts | 36 |
| src/users/profile.ts | 280 |
| src/api/router.ts | 317 |
| src/payments/stripe.ts | 275 |
| src/payments/billing.ts | 144 |
| **Total if fully read** | **~1,106** |

In a real monorepo with 40+ files, the same pattern scales to **~47,000 tokens** before the agent edits one line.

**With Aperture** — one focused bundle (top files ranked by resonance):

```bash
npx @kioie/aperture focus "fix login validation bug" --budget 4000
```

```
Task: fix login validation bug
Symbols: 21/23 · 1106 tok / 4000 budget

  src/auth/login.ts        score=0.378  54 tok
    ↳ seed: "login" matches symbol login
  src/api/router.ts        score=0.071  317 tok
    ↳ seed: "login" matches symbol handleLogin
  src/payments/stripe.ts   score=0.007  275 tok
    ↳ resonance: attached via handleWebhook
```

**1,106 tokens under a 4000 budget — cited line ranges, ranked by relevance.** On a 40-file repo the naive read is ~47k tokens; Aperture keeps the bundle task-scoped.

## Reproduce eval numbers

```bash
git clone https://github.com/kioie/aperture.git
cd aperture
npm install
npm run eval
# or: npx aperture eval
```

Expected: **19/19** cases pass (sample-repo + monorepo + python-repo), mean recall@4000 **100%**.

| Case | Tokens | Top file |
|------|--------|----------|
| Auth — login validation | 1106/4000 | src/auth/login.ts |
| Auth — session creation | 1106/4000 | src/auth/session.ts |
| Payments — webhook handler | 1145/4000 | src/payments/stripe.ts |
| Payments — invoice billing | 1106/4000 | src/payments/billing.ts |
| Users — profile validation | 1106/4000 | src/users/profile.ts |
| API — router + auth | 1106/4000 | src/api/router.ts |
| Python — login validation | varies | src/auth/login.py |

## JSON output for scripts

```bash
aperture focus "stripe webhook handler payment failed" --budget 4000 --format json
# or
aperture focus "stripe webhook handler payment failed" --budget 4000 --json
```

## MCP agent loop

```
1. aperture_focus({ task: "fix login validation bug", budget: 4000 })
2. aperture_read_bundle()
3. Edit using citations like src/auth/login.ts:1-8
4. aperture_explain() if selection looks wrong
```

## Demo (no repo required)

```bash
npx @kioie/aperture demo
```

Prints three task bundles on the sample repo with tree view and selection reasons.
