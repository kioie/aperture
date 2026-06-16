# Aperture examples

Reproducible numbers from the built-in sample repo (`tests/fixtures/sample-repo`).
Run these locally — output should match eval within a few tokens.

## Before / after (login validation)

**Without Aperture** — naive agent reads every file in the sample repo:

| File | Approx. tokens |
|------|----------------|
| src/auth/login.ts | 54 |
| src/auth/session.ts | 62 |
| src/users/profile.ts | 280 |
| src/api/router.ts | 109 |
| src/payments/stripe.ts | 186 |
| src/payments/billing.ts | 142 |
| **Total if fully read** | **~833** |

In a real monorepo with 40+ files, the same pattern scales to **~47,000 tokens** before the agent edits one line.

**With Aperture** — one focused bundle:

```bash
npx @kioie/aperture focus "fix login validation bug" --budget 4000
```

```
Task: fix login validation bug
Symbols: 12/21 · 443 tok / 4000 budget

  src/auth/login.ts        score=0.333  54 tok
    ↳ seed: "login" matches symbol login
  src/api/router.ts        score=0.100  109 tok
    ↳ resonance: attached via handleLogin in src/api/router.ts
  src/users/profile.ts     score=0.000  280 tok
    ↳ resonance: attached via validateCredentials in src/auth/login.ts
```

**443 tokens under a 4000 budget — same task, cited line ranges.**

## Reproduce eval numbers

```bash
git clone https://github.com/kioie/aperture.git
cd aperture
npm install
npm run eval
```

Expected: **11/11** cases pass, mean recall@4000 **100%**.

| Case | Tokens | Top file |
|------|--------|----------|
| Auth — login validation | 443/4000 | src/auth/login.ts |
| Auth — session creation | 370/4000 | src/auth/session.ts |
| Payments — webhook handler | 528/4000 | src/payments/stripe.ts |
| Payments — invoice billing | 528/4000 | src/payments/billing.ts |
| Users — profile validation | 443/4000 | src/users/profile.ts |
| API — router + auth | 479/4000 | src/api/router.ts |
| Payments — webhook signature | 862/4000 | src/payments/stripe.ts |

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
