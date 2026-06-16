# Aperture eval

- [x] Auth — login validation
  task: "fix login validation bug"
  files: src/auth/login.ts, src/api/router.ts, src/users/profile.ts
  tokens: 443/4000 · top score: 0.333

- [x] Auth — session creation
  task: "session creation error"
  files: src/auth/login.ts, src/auth/session.ts, src/users/profile.ts
  tokens: 370/4000 · top score: 0.459

- [x] Payments — webhook handler
  task: "stripe webhook handler payment failed"
  files: src/payments/stripe.ts, src/payments/billing.ts, src/api/router.ts
  tokens: 528/4000 · top score: 0.147

- [x] Payments — invoice billing
  task: "billing invoice charge retry logic"
  files: src/payments/billing.ts, src/api/router.ts, src/payments/stripe.ts
  tokens: 528/4000 · top score: 0.270

- [x] Users — profile update validation
  task: "update user profile email validation"
  files: src/auth/login.ts, src/users/profile.ts, src/api/router.ts
  tokens: 443/4000 · top score: 0.167

- [x] API — router + auth integration
  task: "API route for user login and session"
  files: src/api/router.ts, src/auth/login.ts, src/users/profile.ts, src/auth/session.ts
  tokens: 479/4000 · top score: 0.126

Score: 6/6