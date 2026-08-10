const encoder = new TextEncoder();
const SESSION_DURATION_SECONDS = 8 * 60 * 60;
const PASSWORD_ITERATIONS = 100000;

function bytesToBase64Url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function base64UrlToBytes(value) {
  const base64 = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
}

function textToBase64Url(value) {
  return bytesToBase64Url(encoder.encode(value));
}

function base64UrlToText(value) {
  return new TextDecoder().decode(base64UrlToBytes(value));
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

async function signingKey(secret) {
  const material = await digest(`global-shared-stock-session:${secret}`);
  return crypto.subtle.importKey("raw", material, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
}

async function sign(payload, secret) {
  const signature = await crypto.subtle.sign("HMAC", await signingKey(secret), encoder.encode(payload));
  return bytesToBase64Url(new Uint8Array(signature));
}

export function configuredCredentials(env) {
  if (!env.ADMIN_CREDENTIALS) return null;
  const separator = env.ADMIN_CREDENTIALS.indexOf(":");
  if (separator <= 0 || separator === env.ADMIN_CREDENTIALS.length - 1) return null;
  return {
    email: env.ADMIN_CREDENTIALS.slice(0, separator).trim().toLowerCase(),
    password: env.ADMIN_CREDENTIALS.slice(separator + 1),
  };
}

export async function credentialsAreValid(email, password, env) {
  const configured = configuredCredentials(env);
  if (!configured || typeof email !== "string" || typeof password !== "string") return false;
  return equalBytes(await digest(email.trim().toLowerCase()), await digest(configured.email)) &&
    equalBytes(await digest(password), await digest(configured.password));
}

export async function hashEmail(email) {
  return bytesToBase64Url(await digest(email.trim().toLowerCase()));
}

export async function hashPassword(password, salt = crypto.getRandomValues(new Uint8Array(16))) {
  const material = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const result = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations: PASSWORD_ITERATIONS },
    material,
    256,
  );
  return { hash: bytesToBase64Url(new Uint8Array(result)), salt: bytesToBase64Url(salt), iterations: PASSWORD_ITERATIONS };
}

export async function sellerCredentialsAreValid(email, password, env) {
  if (!env.CADASTROS || typeof email !== "string" || typeof password !== "string") return null;
  const companyId = await env.CADASTROS.get(`conta-email:${await hashEmail(email)}`);
  if (!companyId) return null;
  const account = await env.CADASTROS.get(`conta:${companyId}`, "json");
  if (!account?.active) return null;
  const candidate = await hashPassword(password, base64UrlToBytes(account.salt));
  return equalBytes(encoder.encode(candidate.hash), encoder.encode(account.passwordHash)) ? account : null;
}

export async function createSession(sessionInformation, env) {
  const configured = configuredCredentials(env);
  const payload = textToBase64Url(JSON.stringify({
    ...sessionInformation,
    email: sessionInformation.email.trim().toLowerCase(),
    expiresAt: Date.now() + SESSION_DURATION_SECONDS * 1000,
  }));
  return `${payload}.${await sign(payload, configured.password)}`;
}

export async function getSession(request, env) {
  const configured = configuredCredentials(env);
  if (!configured) return null;
  const cookie = request.headers.get("Cookie") || "";
  const match = cookie.match(/(?:^|;\s*)global_session=([^;]+)/);
  if (!match) return null;

  try {
    const [payload, receivedSignature] = match[1].split(".");
    if (!payload || !receivedSignature) return null;
    const expectedSignature = await sign(payload, configured.password);
    if (!equalBytes(encoder.encode(receivedSignature), encoder.encode(expectedSignature))) return null;
    const session = JSON.parse(base64UrlToText(payload));
    if (session.expiresAt <= Date.now()) return null;
    if (session.role === "admin" && session.email !== configured.email) return null;
    if (session.role === "company" && !session.companyId) return null;
    return session;
  } catch {
    return null;
  }
}

export function sessionCookie(value) {
  return `global_session=${value}; Max-Age=${SESSION_DURATION_SECONDS}; Path=/; HttpOnly; Secure; SameSite=Strict`;
}

export function expiredSessionCookie() {
  return "global_session=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Strict";
}
