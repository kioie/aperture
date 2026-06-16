import { validateCredentials } from "./login.js";

export function createSession(user: string) {
  if (!validateCredentials(user)) throw new Error("invalid");
  return { user, id: "sess_1" };
}
