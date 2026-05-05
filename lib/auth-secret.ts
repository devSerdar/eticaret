export function getAuthSecret(): string {
  const s = process.env.AUTH_SECRET;
  if (s && s.length >= 16) return s;
  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET env (min 16 karakter) uretimde zorunludur.");
  }
  return "dev-only-unsafe-auth-secret";
}
