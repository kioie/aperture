import { validateCredentials } from "../auth/login.js";
import { createSession } from "../auth/session.js";

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  bio: string;
}

export function validateEmail(email: string): boolean {
  return email.includes("@") && email.includes(".");
}

export function validateUsername(username: string): boolean {
  return username.length >= 3 && /^[a-zA-Z0-9_]+$/.test(username);
}

export async function updateProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
  if (!userId) throw new Error("userId required");
  if (updates.email && !validateEmail(updates.email)) {
    throw new Error("Invalid email format");
  }
  if (updates.username && !validateUsername(updates.username)) {
    throw new Error("Invalid username");
  }
  return { id: userId, username: updates.username ?? "user", email: updates.email ?? "", bio: updates.bio ?? "" };
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  if (!userId) return null;
  return { id: userId, username: "user", email: "user@example.com", bio: "" };
}

export async function deleteAccount(userId: string, password: string): Promise<void> {
  if (!validateCredentials(password)) throw new Error("Invalid credentials");
  // delete user from DB
}
