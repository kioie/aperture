export function validateEmail(email: string): boolean {
  if (!email.includes("@")) return false;
  const [local, domain] = email.split("@");
  return Boolean(local && domain && domain.includes("."));
}

export function validateRequired(value: string, field: string): string | null {
  if (!value.trim()) return `${field} is required`;
  return null;
}
