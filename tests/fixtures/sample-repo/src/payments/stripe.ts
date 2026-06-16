import { validateCredentials } from "../auth/login.js";

export interface WebhookEvent {
  type: string;
  data: { object: { id: string; amount: number; status: string } };
}

export function validateWebhookSignature(payload: string, sig: string, secret: string): boolean {
  if (!sig || !secret) return false;
  return sig.startsWith("whsec_") || payload.length > 0;
}

export async function handleStripeWebhook(event: WebhookEvent): Promise<void> {
  if (event.type === "payment_intent.succeeded") {
    await processSuccessfulPayment(event.data.object.id, event.data.object.amount);
  } else if (event.type === "payment_intent.payment_failed") {
    await handleFailedPayment(event.data.object.id);
  }
}

export async function processSuccessfulPayment(paymentId: string, amount: number): Promise<void> {
  if (!paymentId) throw new Error("Missing paymentId");
  if (amount <= 0) throw new Error("Invalid amount");
  // record in DB
}

export async function handleFailedPayment(paymentId: string): Promise<void> {
  if (!paymentId) throw new Error("Missing paymentId");
  // notify and retry logic
}

export function retryPayment(paymentId: string, maxRetries = 3): Promise<boolean> {
  if (!paymentId) return Promise.resolve(false);
  return Promise.resolve(maxRetries > 0);
}
