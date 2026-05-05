import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { getAuthSecret } from "@/lib/auth-secret";

const COOKIE = "ot_session";
const MAX_AGE_SEC = 60 * 60 * 24 * 14;

export type SessionPayload = {
  userId: string;
  email: string;
  displayName: string;
  exp: number;
};

function sign(payloadB64: string): string {
  return createHmac("sha256", getAuthSecret()).update(payloadB64).digest("base64url");
}

function encodeSession(p: Omit<SessionPayload, "exp">): string {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE_SEC;
  const body: SessionPayload = { ...p, exp };
  const payloadB64 = Buffer.from(JSON.stringify(body), "utf8").toString("base64url");
  const sig = sign(payloadB64);
  return `${payloadB64}.${sig}`;
}

function decodeSession(raw: string): SessionPayload | null {
  const i = raw.lastIndexOf(".");
  if (i <= 0) return null;
  const payloadB64 = raw.slice(0, i);
  const sig = raw.slice(i + 1);
  const expected = sign(payloadB64);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const p = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8")) as SessionPayload;
    if (!p.userId || !p.email || typeof p.exp !== "number") return null;
    if (p.exp < Math.floor(Date.now() / 1000)) return null;
    return p;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const jar = await cookies();
  const v = jar.get(COOKIE)?.value;
  if (!v) return null;
  return decodeSession(v);
}

export async function setSessionCookie(payload: Omit<SessionPayload, "exp">): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE, encodeSession(payload), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SEC,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}
