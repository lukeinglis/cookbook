import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { cache } from "react";

const COOKIE_NAME = "cookbook-session";
const SEVEN_DAYS = 60 * 60 * 24 * 7;

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export async function createSession() {
  const token = await new SignJWT({ authenticated: true })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(`${SEVEN_DAYS}s`)
    .setIssuedAt()
    .sign(getSecret());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SEVEN_DAYS,
    path: "/",
  });
}

export async function verifySessionRaw(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return false;

  try {
    await jwtVerify(token, getSecret());
    return true;
  } catch {
    return false;
  }
}

export const verifySession = cache(verifySessionRaw);

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function checkPassword(password: string): Promise<boolean> {
  const sitePassword = process.env.SITE_PASSWORD;
  if (!sitePassword) return false;

  const encoder = new TextEncoder();
  const a = encoder.encode(password);
  const b = encoder.encode(sitePassword);

  if (a.byteLength !== b.byteLength) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    a,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, b);
  const expected = await crypto.subtle.sign("HMAC", key, a);

  const sigArr = new Uint8Array(sig);
  const expectedArr = new Uint8Array(expected);

  let diff = 0;
  for (let i = 0; i < sigArr.length; i++) {
    diff |= sigArr[i] ^ expectedArr[i];
  }
  return diff === 0;
}
