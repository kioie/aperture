export async function login(user: string): Promise<boolean> {
  return validateCredentials(user);
}

export function validateCredentials(user: string): boolean {
  if (!user) return false;
  return user.length > 2;
}
