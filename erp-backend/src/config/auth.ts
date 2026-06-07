import crypto from "crypto";
import type { Request } from "express";

const SESSION_COOKIE_NAME = "amar_erp_session";
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

const DEFAULT_ALLOWED_EMAILS = [
  "amarpackers.admin@gmail.com",
  "amarpackers.delhi@gmail.com",
  "amarpackers.finance@gmail.com",
];

type SessionPayload = {
  email: string;
  expiresAt: number;
};

function getAllowedEmails() {
  return (process.env.AUTH_ALLOWED_EMAILS ?? DEFAULT_ALLOWED_EMAILS.join(","))
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function getPassword() {
  return process.env.AUTH_PASSWORD ?? "AmarPackers@2026";
}

function getSessionSecret() {
  const secret = process.env.AUTH_SESSION_SECRET;

  if (secret && secret.length >= 32) {
    return secret;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SESSION_SECRET must be set to at least 32 characters in production.");
  }

  return "local-development-session-secret-change-before-production";
}

function base64Url(input: string | Buffer) {
  return Buffer.from(input).toString("base64url");
}

function signPayload(encodedPayload: string) {
  return crypto
    .createHmac("sha256", getSessionSecret())
    .update(encodedPayload)
    .digest("base64url");
}

function parseCookies(req: Request) {
  const cookieHeader = req.headers.cookie;
  const cookies: Record<string, string> = {};

  if (!cookieHeader) {
    return cookies;
  }

  for (const cookie of cookieHeader.split(";")) {
    const [rawName, ...rawValue] = cookie.trim().split("=");
    if (!rawName || rawValue.length === 0) {
      continue;
    }

    cookies[rawName] = decodeURIComponent(rawValue.join("="));
  }

  return cookies;
}

function timingSafeCompare(left: string, right: string) {
  const leftHash = crypto.createHash("sha256").update(left).digest();
  const rightHash = crypto.createHash("sha256").update(right).digest();

  return crypto.timingSafeEqual(leftHash, rightHash);
}

export function isAllowedEmail(email: string) {
  return getAllowedEmails().includes(email.trim().toLowerCase());
}

export function isValidPassword(password: string) {
  return timingSafeCompare(password, getPassword());
}

export function createSessionToken(email: string) {
  const payload: SessionPayload = {
    email: email.trim().toLowerCase(),
    expiresAt: Date.now() + SESSION_TTL_MS,
  };
  const encodedPayload = base64Url(JSON.stringify(payload));
  const signature = signPayload(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

export function readSession(req: Request): SessionPayload | null {
  const token = parseCookies(req)[SESSION_COOKIE_NAME];

  if (!token) {
    return null;
  }

  const [encodedPayload, signature] = token.split(".");

  if (!encodedPayload || !signature || !timingSafeCompare(signature, signPayload(encodedPayload))) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as SessionPayload;

    if (!isAllowedEmail(payload.email) || payload.expiresAt <= Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function getSessionCookie(token: string) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";

  return `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}; HttpOnly; Path=/; Max-Age=${
    SESSION_TTL_MS / 1000
  }; SameSite=Lax${secure}`;
}

export function getExpiredSessionCookie() {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";

  return `${SESSION_COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax${secure}`;
}
