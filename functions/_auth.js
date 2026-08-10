const encoder = new TextEncoder();
const SESSION_DURATION_SECONDS = 8 * 60 * 60;

function bytesToBase64Url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function textToBase64Url(value) {
  return bytesToBase64Url(encoder.encode(value));
}

function base64UrlToText(value) {
  const base64 = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  const bytes = Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

async function digest(value) {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(value)));
}

function equalBytes(first, second) {
  if (first.length !== second.length) return false;
  let difference = 0;
  for (let index = 0; index < first.length; index += 1) difference |= first[index] ^ second[index];
  return difference === 0;
}

async function signingKey(password) {
  const material = await digest(`global-shared-stock-session:${password}`);
  return crypto.subtle.importKey("raw", material, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
}

async function sign(payload, password) {
  const signature = await crypto.subtle.sign("HMAC", await signingKey(password), encoder.encode(payload));
  return bytesToBase64Url(new Uint8Array(signature));
}

export async function credentialsAreValid(email, password, env) {
  if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD || typeof email !== "string" || typeof password !== "string") return false;
  const receivedEmail = await digest(email.trim().toLowerCase());
  const expectedEmail = await digest(env.ADMIN_EMAIL.trim().toLowerCase());
  const receivedPassword = await digest(password);
  const expectedPassword = await digest(env.ADMIN_PASSWORD);
  return equalBytes(receivedEmail, expectedEmail) && equalBytes(receivedPassword, expectedPassword);
}

export async function createSession(email, env) {
  const payload = textToBase64Url(JSON.stringify({
    email: email.trim().toLowerCase(),
    expiresAt: Date.now() + SESSION_DURATION_SECONDS * 1000,
  }));
  return `${payload}.${await sign(payload, env.ADMIN_PASSWORD)}`;
}

export async function sessionIsValid(request, env) {
  if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) return false;
  const cookie = request.headers.get("Cookie") || "";
  const match = cookie.match(/(?:^|;\s*)admin_session=([^;]+)/);
  if (!match) return false;

  try {
    const [payload, receivedSignature] = match[1].split(".");
    if (!payload || !receivedSignature) return false;
    const expectedSignature = await sign(payload, env.ADMIN_PASSWORD);
    const signaturesMatch = equalBytes(encoder.encode(receivedSignature), encoder.encode(expectedSignature));
    if (!signaturesMatch) return false;
    const session = JSON.parse(base64UrlToText(payload));
    return session.email === env.ADMIN_EMAIL.trim().toLowerCase() && session.expiresAt > Date.now();
  } catch {
    return false;
  }
}

export function sessionCookie(value) {
  return `admin_session=${value}; Max-Age=${SESSION_DURATION_SECONDS}; Path=/; HttpOnly; Secure; SameSite=Strict`;
}

export function expiredSessionCookie() {
  return "admin_session=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Strict";
}
