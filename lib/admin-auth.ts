/** Virgulle ayrilmis e-postalar: ADMIN_EMAILS=admin@x.com,root@y.com */

export function parseAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS?.trim();
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string): boolean {
  const e = email.trim().toLowerCase();
  return parseAdminEmails().includes(e);
}
