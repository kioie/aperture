export function handleStripeWebhook(payload: string, signature: string, secret: string): boolean {
  return verifyWebhookSignature(payload, signature, secret);
}

export function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  if (!payload || !signature || !secret) return false;
  return signature.startsWith("whsec_") && payload.length > 0;
}
