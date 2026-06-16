# Aperture eval

Budget: 4000 tokens per case

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

Score: 10/10
Mean recall@4000: 100.0%