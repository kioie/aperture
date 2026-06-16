export interface Session {
  id: string;
  userId: string;
  expiresAt: number;
}

export function createSession(userId: string): Session {
  return { id: crypto.randomUUID(), userId, expiresAt: Date.now() + 86_400_000 };
}

export function isSessionExpired(session: Session): boolean {
  return Date.now() > session.expiresAt;
}
