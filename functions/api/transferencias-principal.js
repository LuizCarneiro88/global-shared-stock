import { getSession } from "../_auth.js";
import { createConfirmation, listCompanyUsers, publicTransfer } from "../_primary-transfer.js";

function error(message, status = 400) {
  return Response.json({ message }, { status, headers: { "Cache-Control": "no-store" } });
}

async function listTransfers(env) {
  const transfers = [];
  let cursor;
  do {
    const page = await env.CADASTROS.list({ prefix: "transferencia-principal:", cursor });
    const records = await Promise.all(page.keys.map((key) => env.CADASTROS.get(key.name, "json")));
    transfers.push(...records.filter(Boolean));
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);
  return transfers.sort((first, second) => second.requestedAt.localeCompare(first.requestedAt));
}

export async function onRequestGet(context) {
  if (!context.env.CADASTROS) return error("O armazenamento ainda não está configurado.", 503);
  const session = await getSession(context.request, context.env);
  if (session?.role !== "admin") return error("Acesso administrativo necessário.", 403);
  return Response.json({ transfers: (await listTransfers(context.env)).map(publicTransfer) }, { headers: { "Cache-Control": "no-store" } });
}

export async function onRequestPost(context) {
  if (!context.env.CADASTROS) return error("O armazenamento ainda não está configurado.", 503);
  const session = await getSession(context.request, context.env);
  if (session?.role !== "admin") return error("Acesso administrativo necessário.", 403);
  let input;
  try { input = await context.request.json(); }
  catch { return error("Não foi possível ler a solicitação."); }
  const reason = String(input.reason || "").trim().replace(/\s+/g, " ").slice(0, 800);
  if (reason.length < 10) return error("Informe o motivo excepcional com pelo menos 10 caracteres.");
  const newPrimary = await context.env.CADASTROS.get(`usuario:${String(input.newPrimaryUserId || "")}`, "json");
  if (!newPrimary || newPrimary.role !== "additional" || !newPrimary.emailConfirmedAt || !newPrimary.adminApprovedAt || !newPrimary.active) return error("Selecione um usuário adicional ativo e com e-mail confirmado.");
  const company = await context.env.CADASTROS.get(`cadastro:${newPrimary.companyId}:dados`, "json");
  if (!company) return error("Empresa não encontrada.", 404);
  if (["awaiting_confirmation", "awaiting_admin"].includes(company.primaryTransfer?.status)) return error("Esta empresa já possui uma transferência em andamento.", 409);
  const users = await listCompanyUsers(context.env, newPrimary.companyId);
  const currentPrimary = users.find((user) => user.role === "primary");
  if (!currentPrimary) return error("O usuário principal atual não foi encontrado.", 409);
  const now = new Date().toISOString();
  const transfer = { id: crypto.randomUUID(), companyId: company.id, companyName: company.companyName, currentPrimaryUserId: currentPrimary.userId, currentPrimaryName: currentPrimary.name, currentPrimaryEmail: currentPrimary.email, newPrimaryUserId: newPrimary.userId, newPrimaryName: newPrimary.name, newPrimaryEmail: newPrimary.email, initiatedBy: "admin", exceptionalReason: reason, requestedByAdmin: session.email, status: "awaiting_confirmation", requestedAt: now };
  const confirmationLink = await createConfirmation(context.env, transfer, context.request.url);
  await context.env.CADASTROS.put(`transferencia-principal:${transfer.id}`, JSON.stringify(transfer));
  await context.env.CADASTROS.put(`cadastro:${company.id}:dados`, JSON.stringify({ ...company, primaryTransfer: { id: transfer.id, status: transfer.status, newPrimaryName: newPrimary.name, requestedAt: now, exceptional: true } }));
  return Response.json({ transfer: publicTransfer(transfer), confirmationLink, message: "Transferência excepcional iniciada. O novo principal deve confirmar pelo link seguro." }, { status: 201, headers: { "Cache-Control": "no-store" } });
}

export function onRequest() {
  return new Response("Método não permitido.", { status: 405, headers: { Allow: "GET, POST" } });
}
