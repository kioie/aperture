# Aperture eval

Budget: 4000 tokens per case

- [x] Auth — login validation
  task: "fix login validation bug"
  files: src/auth/login.ts, src/api/router.ts, src/users/profile.ts
  tokens: 443/4000 · top score: 0.333 · recall@4000: 100%

- [x] Auth — session creation
  task: "session creation error"
  files: src/auth/login.ts, src/auth/session.ts, src/users/profile.ts
  tokens: 370/4000 · top score: 0.459 · recall@4000: 100%

- [x] Payments — webhook handler
  task: "stripe webhook handler payment failed"
  files: src/payments/stripe.ts, src/payments/billing.ts, src/api/router.ts
  tokens: 528/4000 · top score: 0.164 · recall@4000: 100%

- [x] Payments — invoice billing
  task: "billing invoice charge retry logic"
  files: src/payments/billing.ts, src/payments/stripe.ts, src/api/router.ts
  tokens: 528/4000 · top score: 0.156 · recall@4000: 100%

- [x] Users — profile update validation
  task: "update user profile email validation"
  files: src/auth/login.ts, src/users/profile.ts, src/api/router.ts
  tokens: 443/4000 · top score: 0.182 · recall@4000: 100%

- [x] API — router + auth integration
  task: "API route for user login and session"
  files: src/api/router.ts, src/auth/login.ts, src/users/profile.ts, src/auth/session.ts
  tokens: 479/4000 · top score: 0.126 · recall@4000: 100%

- [x] Payments — webhook signature
  task: "validate stripe webhook signature"
  files: src/payments/stripe.ts, src/auth/login.ts, src/users/profile.ts, src/api/router.ts, src/payments/billing.ts
  tokens: 862/4000 · top score: 0.159 · recall@4000: 100%

- [x] Payments — invoice creation
  task: "create invoice for user billing"
  files: src/auth/login.ts, src/payments/billing.ts, src/api/router.ts, src/payments/stripe.ts, src/users/profile.ts, src/auth/session.ts
  tokens: 898/4000 · top score: 0.094 · recall@4000: 100%

- [x] Users — profile lookup
  task: "get user profile by id"
  files: src/auth/login.ts, src/users/profile.ts, src/api/router.ts
  tokens: 443/4000 · top score: 0.179 · recall@4000: 100%

Score: 9/9
Mean recall@4000: 100.0%