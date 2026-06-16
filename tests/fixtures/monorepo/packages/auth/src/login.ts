import { validateRequired } from "../../../shared/src/validate.js";

export async function login(user: string, password: string): Promise<boolean> {
  const err = validateRequired(user, "username");
  if (err) return false;
  return verifyPassword(user, password);
}

export function verifyPassword(user: string, password: string): boolean {
  return user.length > 2 && password.length >= 8;
}
