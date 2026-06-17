# Aperture eval

Budget: 4000 tokens per case

## sample-repo
Index: cold 19ms · disk cache 2ms

- [x] Auth — login validation
  task: "fix login validation bug"
  files: src/auth/login.ts, src/api/router.ts, src/payments/stripe.ts, src/auth/session.ts, src/users/profile.ts, src/payments/billing.ts
  tokens: 1106/4000 · top score: 0.378 · recall@4000: 100%

- [x] Auth — session creation
  task: "session creation error"
  files: src/auth/login.ts, src/auth/session.ts, src/payments/stripe.ts, src/users/profile.ts, src/payments/billing.ts, src/api/router.ts
  tokens: 1106/4000 · top score: 0.459 · recall@4000: 100%

- [x] Payments — webhook handler
  task: "stripe webhook handler payment failed"
  files: src/payments/stripe.ts, src/payments/billing.ts, src/api/router.ts, src/payments/index.ts, src/auth/login.ts, src/users/profile.ts, src/auth/session.ts
  tokens: 1145/4000 · top score: 0.164 · recall@4000: 100%

- [x] Payments — invoice billing
  task: "billing invoice charge retry logic"
  files: src/payments/billing.ts, src/payments/stripe.ts, src/api/router.ts, src/auth/login.ts, src/users/profile.ts, src/auth/session.ts
  tokens: 1106/4000 · top score: 0.158 · recall@4000: 100%

- [x] Users — profile update validation
  task: "update user profile email validation"
  files: src/auth/login.ts, src/users/profile.ts, src/api/router.ts, src/payments/stripe.ts, src/payments/billing.ts, src/auth/session.ts
  tokens: 1106/4000 · top score: 0.200 · recall@4000: 100%

- [x] API — router + auth integration
  task: "API route for user login and session"
  files: src/auth/login.ts, src/api/router.ts, src/users/profile.ts, src/payments/stripe.ts, src/auth/session.ts, src/payments/billing.ts
  tokens: 1106/4000 · top score: 0.183 · recall@4000: 100%

- [x] Payments — webhook signature
  task: "validate stripe webhook signature"
  files: src/payments/stripe.ts, src/auth/login.ts, src/users/profile.ts, src/api/router.ts, src/payments/billing.ts, src/auth/session.ts
  tokens: 1106/4000 · top score: 0.163 · recall@4000: 100%

- [x] Payments — invoice creation
  task: "create invoice for user billing"
  files: src/auth/login.ts, src/payments/billing.ts, src/payments/stripe.ts, src/users/profile.ts, src/api/router.ts, src/auth/session.ts
  tokens: 1106/4000 · top score: 0.114 · recall@4000: 100%

- [x] Users — profile lookup
  task: "get user profile by id"
  files: src/auth/login.ts, src/users/profile.ts, src/api/router.ts, src/payments/stripe.ts, src/payments/billing.ts, src/auth/session.ts
  tokens: 1106/4000 · top score: 0.199 · recall@4000: 100%

- [x] Auth — barrel index re-exports
  task: "auth barrel re-export login flow"
  files: src/auth/login.ts, src/api/router.ts, src/auth/session.ts, src/auth/index.ts, src/payments/stripe.ts, src/users/profile.ts, src/payments/billing.ts
  tokens: 1132/4000 · top score: 0.430 · recall@4000: 100%

- [x] Payments — barrel index re-exports
  task: "payments barrel re-export stripe billing"
  files: src/payments/stripe.ts, src/payments/billing.ts, src/payments/index.ts, src/auth/login.ts, src/users/profile.ts, src/api/router.ts, src/auth/session.ts
  tokens: 1145/4000 · top score: 0.160 · recall@4000: 100%

## monorepo
Index: cold 2ms · disk cache 1ms

- [x] Monorepo — cross-package auth login
  task: "cross-package login handler in api server"
  files: packages/auth/src/login.ts, packages/payments/src/stripe.ts, packages/payments/src/billing.ts, packages/auth/src/session.ts, packages/shared/src/validate.ts, apps/api/src/server.ts, packages/auth/src/index.ts, packages/payments/src/index.ts
  tokens: 716/4000 · top score: 0.117 · recall@4000: 100%

- [x] Monorepo — shared validation package
  task: "shared email validation utility"
  files: packages/shared/src/validate.ts, apps/api/src/server.ts, packages/payments/src/billing.ts, packages/payments/src/stripe.ts, packages/auth/src/login.ts, packages/auth/src/session.ts
  tokens: 644/4000 · top score: 0.409 · recall@4000: 100%

- [x] Monorepo — payments webhook via packages
  task: "stripe webhook handler in api app"
  files: packages/payments/src/stripe.ts, apps/api/src/server.ts, packages/payments/src/billing.ts, packages/shared/src/validate.ts, packages/auth/src/login.ts, packages/auth/src/session.ts
  tokens: 644/4000 · top score: 0.195 · recall@4000: 100%

- [x] Monorepo — billing retry across packages
  task: "retry failed billing charge invoice"
  files: packages/payments/src/billing.ts, apps/api/src/server.ts, packages/payments/src/stripe.ts, packages/shared/src/validate.ts, packages/auth/src/login.ts, packages/auth/src/session.ts
  tokens: 644/4000 · top score: 0.409 · recall@4000: 100%

## python-repo
Index: cold 4ms · disk cache 1ms

- [x] Python — login validation
  task: "fix login validation bug"
  files: src/auth/login.py, src/users/profile.py
  tokens: 21/4000 · top score: 0.500 · recall@4000: 100%

- [x] Python — webhook handler
  task: "stripe webhook handler payment failed"
  files: src/payments/stripe.py, src/payments/billing.py, src/payments/__init__.py
  tokens: 31/4000 · top score: 0.308 · recall@4000: 100%

- [x] Python — profile validation
  task: "update user profile email validation"
  files: src/auth/login.py, src/users/profile.py
  tokens: 21/4000 · top score: 0.353 · recall@4000: 100%

- [x] Python — billing retry
  task: "retry failed billing charge invoice"
  files: src/payments/billing.py, src/payments/stripe.py
  tokens: 4/4000 · top score: 0.442 · recall@4000: 100%

Score: 19/19
Mean recall@4000: 100.0%