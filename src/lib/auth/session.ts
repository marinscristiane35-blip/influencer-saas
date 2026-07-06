import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export type SessionPayload = {
  sessionType: "saas_admin" | "company_user" | "influencer";
  userId?: string;
  companyId?: string;
  influencerId?: string;
  role: string;
  expiresAt: number;
};

const cookieNames = {
  company_user: "company_session",
  influencer: "influencer_session",
  saas_admin: "saas_admin_session",
} satisfies Record<SessionPayload["sessionType"], string>;

const legacyCookieNames = {
  company_user: "influencer_saas_company_session",
  influencer: "influencer_saas_influencer_session",
  saas_admin: "influencer_saas_admin_session",
} satisfies Record<SessionPayload["sessionType"], string>;

const sessionTtlMs = 1000 * 60 * 60 * 24 * 7;

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET precisa ter pelo menos 32 caracteres.");
  }

  return secret;
}

function sign(value: string) {
  return createHmac("sha256", getSessionSecret()).update(value).digest("hex");
}

function encodeSession(payload: SessionPayload) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = sign(body);

  return `${body}.${signature}`;
}

function decodeSession(value?: string): SessionPayload | null {
  if (!value) {
    return null;
  }

  const [body, signature] = value.split(".");

  if (!body || !signature) {
    return null;
  }

  const expected = sign(body);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null;
  }

  const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as SessionPayload;

  if (payload.expiresAt < Date.now()) {
    return null;
  }

  return payload;
}

export async function createSession(input: Omit<SessionPayload, "expiresAt">) {
  const cookieStore = await cookies();
  const expiresAt = Date.now() + sessionTtlMs;

  cookieStore.set(cookieNames[input.sessionType], encodeSession({ ...input, expiresAt }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(expiresAt),
  });
  cookieStore.delete(legacyCookieNames[input.sessionType]);
}

export async function getSession(sessionType?: SessionPayload["sessionType"]) {
  const cookieStore = await cookies();

  if (sessionType) {
    const session = decodeSession(cookieStore.get(cookieNames[sessionType])?.value);
    const legacySession = decodeSession(
      cookieStore.get(legacyCookieNames[sessionType])?.value,
    );

    return session?.sessionType === sessionType
      ? session
      : legacySession?.sessionType === sessionType
        ? legacySession
        : null;
  }

  for (const cookieName of [
    ...Object.values(cookieNames),
    ...Object.values(legacyCookieNames),
  ]) {
    const session = decodeSession(cookieStore.get(cookieName)?.value);

    if (session) {
      return session;
    }
  }

  return null;
}

export async function destroySession(sessionType?: SessionPayload["sessionType"]) {
  const cookieStore = await cookies();

  if (sessionType) {
    cookieStore.delete(cookieNames[sessionType]);
    cookieStore.delete(legacyCookieNames[sessionType]);
    return;
  }

  for (const cookieName of [
    ...Object.values(cookieNames),
    ...Object.values(legacyCookieNames),
  ]) {
    cookieStore.delete(cookieName);
  }
}
