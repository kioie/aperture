import { processSuccessfulPayment, retryPayment } from "./stripe.js";

export interface Invoice {
  id: string;
  userId: string;
  amount: number;
  paid: boolean;
}

export async function createInvoice(userId: string, amount: number): Promise<Invoice> {
  if (!userId) throw new Error("userId required");
  if (amount <= 0) throw new Error("amount must be positive");
  return { id: `inv_${Date.now()}`, userId, amount, paid: false };
}

export async function chargeInvoice(invoice: Invoice): Promise<void> {
  if (invoice.paid) return;
  await processSuccessfulPayment(invoice.id, invoice.amount);
  invoice.paid = true;
}

export async function retryFailedInvoice(invoice: Invoice): Promise<boolean> {
  return retryPayment(invoice.id);
}
