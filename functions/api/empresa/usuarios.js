import { getSession, hashEmail } from "../../_auth.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LINK_DURATION_SECONDS = 24 * 60 * 60;

function error(message, status = 400) {
  return Response.json({ message }, { status, headers: { "Cache-Control": "no-store" } });
}

function bytesToBase64Url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

async function tokenHash(token) {
  const bytes = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token)));
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function listUsers(env, companyId) {
  const users = [];
  let cursor;
  do {
    const page = await env.CADASTROS.list({ prefix: "usuario:", cursor });
    const records = await Promise.all(page.keys.map((key) => env.CADASTROS.get(key.name, "json")));
    users.push(...records.filter((user) => user?.companyId === companyId));
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);
  if (!users.some((user) => user.role === "primary")) {
    const legacy = await env.CADASTROS.get(`conta:${companyId}`, "json");
    if (legacy) users.push({ userId: "", companyId, companyName: legacy.companyName, name: legacy.companyName, email: legacy.email, role: "primary", emailConfirmedAt: legacy.createdAt, primaryApprovedAt: legacy.createdAt, adminApprovedAt: legacy.createdAt, active: Boolean(legacy.active), createdAt: legacy.createdAt, legacy: true });
  }
  return users.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

function publicUser(user) {
  const { passwordHash, salt, iterations, ...safe } = user;
  return safe;
}

export async function onRequestGet(context) {
  const session = await getSession(context.request, context.env);
  if (session?.role !== "company") return error("Acesso da empresa necessário.", 401);
  return Response.json({ users: (await listUsers(context.env, session.companyId)).map(publicUser), canManage: !session.userId || session.userRole === "primary" }, { headers: { "Cache-Control": "no-store" } });
}

export async function onRequestPost(context) {
  const session = await getSession(context.request, context.env);
  if (session?.role !== "company") return error("Acesso da empresa necessário.", 401);
  if (session.userId && session.userRole !== "primary") return error("Somente o usuário principal pode solicitar novos acessos.", 403);

  let input;
  try { input = await context.request.json(); } catch { return error("Não foi possível ler os dados do usuário."); }
  const name = String(input.name || "").trim().slice(0, 150);
  const email = String(input.email || "").trim().toLowerCase().slice(0, 254);
  if (!name) return error("Informe o nome do usuário.");
  if (!EMAIL_PATTERN.test(email)) return error("Informe um e-mail válido.");
  if (await context.env.CADASTROS.get(`usuario-email:${await hashEmail(email)}`) || await context.env.CADASTROS.get(`conta-email:${await hashEmail(email)}`)) {
    return error("Este e-mail já possui um acesso cadastrado.", 409);
  }

  const company = await context.env.CADASTROS.get(`cadastro:${session.companyId}:dados`, "json");
  if (!company || company.status !== "approved") return error("A empresa precisa estar aprovada.", 403);
  const now = new Date().toISOString();
  const userId = crypto.randomUUID();
  const user = { userId, companyId: company.id, companyName: company.companyName, name, email, role: "additional", emailConfirmedAt: null, primaryApprovedAt: now, adminApprovedAt: null, active: false, createdAt: now };
  await context.env.CADASTROS.put(`usuario:${userId}`, JSON.stringify(user));
  await context.env.CADASTROS.put(`usuario-email:${await hashEmail(email)}`, userId);

  const token = bytesToBase64Url(crypto.getRandomValues(new Uint8Array(32)));
  const hash = await tokenHash(token);
  const expiresAt = Date.now() + LINK_DURATION_SECONDS * 1000;
  await context.env.CADASTROS.put(`ativacao:${hash}`, JSON.stringify({ companyId: company.id, userId, email, expiresAt }), { expirationTtl: LINK_DURATION_SECONDS });
  const link = new URL("/ativar-acesso", context.request.url);
  link.searchParams.set("token", token);
  return Response.json({ user: publicUser(user), confirmationLink: link.toString(), message: "Usuário incluído. O link seguro está pronto para confirmação do e-mail." }, { status: 201, headers: { "Cache-Control": "no-store" } });
}

export function onRequest() {
  return new Response("Método não permitido.", { status: 405, headers: { Allow: "GET, POST" } });
}
