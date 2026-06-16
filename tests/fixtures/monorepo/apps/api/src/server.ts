import { login, createSession } from "../../../packages/auth/src/index.js";
import { handleStripeWebhook, createInvoice, retryFailedCharge } from "../../../packages/payments/src/index.js";
import { validateEmail } from "../../../packages/shared/src/validate.js";

export async function handleLogin(body: { user: string; password: string }) {
  const ok = await login(body.user, body.password);
  if (!ok) return { status: 401, body: { error: "Unauthorized" } };
  return { status: 200, body: createSession(body.user) };
}

export async function handleStripeEvent(body: string, signature: string, secret: string) {
  if (!handleStripeWebhook(body, signature, secret)) {
    return { status: 400, body: { error: "Invalid webhook" } };
  }
  return { status: 200, body: { received: true } };
}

export async function handleBillingRetry(invoiceId: string, invoice: { userId: string; amount: number; status: "failed" }) {
  const retried = retryFailedCharge({ id: invoiceId, ...invoice });
  return { status: 200, body: retried };
}

export function handleProfileEmailUpdate(email: string) {
  if (!validateEmail(email)) return { status: 400, body: { error: "Invalid email" } };
  return { status: 200, body: { email } };
}
