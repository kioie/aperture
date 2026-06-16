import { login, createSession } from "../auth/index.js";
import { updateProfile, getUserProfile } from "../users/profile.js";
import { handleStripeWebhook, validateWebhookSignature, createInvoice } from "../payments/index.js";

export type Route = { method: string; path: string; handler: Function };

export const routes: Route[] = [
  { method: "POST", path: "/auth/login", handler: handleLogin },
  { method: "GET", path: "/users/:id", handler: handleGetUser },
  { method: "PUT", path: "/users/:id", handler: handleUpdateUser },
  { method: "POST", path: "/webhooks/stripe", handler: handleWebhook },
  { method: "POST", path: "/billing/invoice", handler: handleCreateInvoice },
];

export async function handleLogin(req: { body: { user: string } }) {
  const ok = await login(req.body.user);
  if (!ok) return { status: 401, body: { error: "Unauthorized" } };
  const session = createSession(req.body.user);
  return { status: 200, body: session };
}

export async function handleGetUser(req: { params: { id: string } }) {
  const profile = await getUserProfile(req.params.id);
  if (!profile) return { status: 404, body: { error: "Not found" } };
  return { status: 200, body: profile };
}

export async function handleUpdateUser(req: { params: { id: string }; body: Record<string, string> }) {
  const updated = await updateProfile(req.params.id, req.body);
  return { status: 200, body: updated };
}

export async function handleWebhook(req: { body: string; headers: Record<string, string> }) {
  const valid = validateWebhookSignature(req.body, req.headers["stripe-signature"], process.env.STRIPE_SECRET ?? "");
  if (!valid) return { status: 400, body: { error: "Invalid signature" } };
  return { status: 200, body: { received: true } };
}

export async function handleCreateInvoice(req: { body: { userId: string; amount: number } }) {
  const inv = await createInvoice(req.body.userId, req.body.amount);
  return { status: 201, body: inv };
}
