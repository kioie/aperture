export interface Invoice {
  id: string;
  userId: string;
  amount: number;
  status: "pending" | "paid" | "failed";
}

export function createInvoice(userId: string, amount: number): Invoice {
  return { id: crypto.randomUUID(), userId, amount, status: "pending" };
}

export function retryFailedCharge(invoice: Invoice): Invoice {
  if (invoice.status !== "failed") return invoice;
  return { ...invoice, status: "pending" };
}
