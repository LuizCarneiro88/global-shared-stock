import { getSession } from "../_auth.js";

function error(message, status = 400) {
  return Response.json({ message }, { status, headers: { "Cache-Control": "no-store" } });
}

async function listUsers(env) {
  const users = [];
  let cursor;
  do {
    const page = await env.CADASTROS.list({ prefix: "usuario:", cursor });
    const records = await Promise.all(page.keys.map((key) => env.CADASTROS.get(key.name, "json")));
    users.push(...records.filter(Boolean));
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);
  const knownEmails = new Set(users.map((user) => user.email?.toLowerCase()));
  cursor = undefined;
  do {
    const page = await env.CADASTROS.list({ prefix: "conta:", cursor });
    const records = await Promise.all(page.keys.map((key) => env.CADASTROS.get(key.name, "json")));
    records.filter((account) => account?.email && !knownEmails.has(account.email.toLowerCase())).forEach((account) => {
      users.push({ userId: "", companyId: account.companyId, companyName: account.companyName, name: account.companyName, email: account.email, role: "primary", emailConfirmedAt: account.createdAt, primaryApprovedAt: account.createdAt, adminApprovedAt: account.createdAt, active: Boolean(account.active), createdAt: account.createdAt, legacy: true });
    });
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);
  return users.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}


function publicUser(user) {
  const { passwordHash, salt, iterations, ...safe } = user;
  return safe;
}

export async function onRequestGet(context) {
  const session = await getSession(context.request, context.env);
  if (session?.role !== "admin") return error("Esta ação só pode ser realizada pelo Administrador.", 403);
  return Response.json({ users: (await listUsers(context.env)).map(publicUser) }, { headers: { "Cache-Control": "no-store" } });
}

export async function onRequestPatch(context) {
  const session = await getSession(context.request, context.env);
  if (session?.role !== "admin") return error("Esta ação só pode ser realizada pelo Administrador.", 403);
  let input;
  try { input = await context.request.json(); } catch { return error("Não foi possível ler a decisão."); }
  const userId = String(input.userId || "");
  const user = await context.env.CADASTROS.get(`usuario:${userId}`, "json");
  if (!user) return error("Usuário não encontrado.", 404);
  const decidedAt = new Date().toISOString();
  if (input.action === "approve") {
    user.adminApprovedAt = decidedAt;
    user.rejectionReason = "";
    user.active = Boolean(user.emailConfirmedAt && (user.role === "primary" || user.primaryApprovedAt));
  } else if (input.action === "reject") {
    const reason = String(input.reason || "").trim().slice(0, 500);
    if (!reason) return error("Informe o motivo da rejeição.");
    user.adminApprovedAt = null;
    user.active = false;
    user.rejectionReason = reason;
    user.rejectedAt = decidedAt;
  } else return error("Decisão inválida.");
  user.updatedAt = decidedAt;
  await context.env.CADASTROS.put(`usuario:${userId}`, JSON.stringify(user));
  return Response.json({ success: true, user: publicUser(user), message: input.action === "approve" ? "Usuário aprovado pelo Administrador." : "Usuário rejeitado com o motivo informado." }, { headers: { "Cache-Control": "no-store" } });
}

export function onRequest() {
  return new Response("Método não permitido.", { status: 405, headers: { Allow: "GET, PATCH" } });
}
