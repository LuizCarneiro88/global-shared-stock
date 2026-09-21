import { getSession, hashEmail } from "../../_auth.js";
import { createConfirmation, listCompanyUsers, publicTransfer } from "../../_primary-transfer.js";

function error(message, status = 400) {
  return Response.json({ message }, { status, headers: { "Cache-Control": "no-store" } });
}

async function ensurePrimaryUser(env, company, users) {
  const existing = users.find((user) => user.role === "primary");
  if (existing) return existing;
  const legacy = await env.CADASTROS.get(`conta:${company.id}`, "json");
  if (!legacy) return null;
  const now = new Date().toISOString();
  const user = { userId: crypto.randomUUID(), companyId: company.id, companyName: company.companyName, name: company.primaryContact || company.companyName, email: legacy.email || company.primaryEmail, role: "primary", emailConfirmedAt: legacy.createdAt || now, primaryApprovedAt: legacy.createdAt || now, adminApprovedAt: legacy.createdAt || now, active: Boolean(legacy.active), passwordHash: legacy.passwordHash, salt: legacy.salt, iterations: legacy.iterations, createdAt: legacy.createdAt || now, migratedFromLegacyAt: now };
  await env.CADASTROS.put(`usuario:${user.userId}`, JSON.stringify(user));
  await env.CADASTROS.put(`usuario-email:${await hashEmail(user.email)}`, user.userId);
  return user;
}

export async function onRequestPost(context) {
  if (!context.env.CADASTROS) return error("O armazenamento ainda não está configurado.", 503);
  const session = await getSession(context.request, context.env);
  if (session?.role !== "company" || (session.userId && session.userRole !== "primary")) return error("Somente o usuário principal pode solicitar a transferência.", 403);
  let input;
  try { input = await context.request.json(); }
  catch { return error("Não foi possível ler a solicitação."); }
  const company = await context.env.CADASTROS.get(`cadastro:${session.companyId}:dados`, "json");
  if (!company || company.status !== "approved") return error("A empresa precisa estar aprovada.", 403);
  const users = await listCompanyUsers(context.env, session.companyId);
  const currentPrimary = await ensurePrimaryUser(context.env, company, users);
  const newPrimary = users.find((user) => user.userId === input.newPrimaryUserId);
  if (!currentPrimary) return error("O usuário principal atual não foi encontrado.", 409);
  if (currentPrimary.email?.toLowerCase() !== session.email?.toLowerCase()) return error("Sua sessão não pertence mais ao usuário principal atual. Entre novamente.", 403);
  if (!newPrimary || newPrimary.role !== "additional") return error("Selecione um usuário adicional válido.");
  if (!newPrimary.emailConfirmedAt || !newPrimary.adminApprovedAt || !newPrimary.active) return error("O novo principal precisa estar com e-mail confirmado e acesso aprovado.", 409);
  if (company.primaryTransfer?.status === "awaiting_confirmation" || company.primaryTransfer?.status === "awaiting_admin") return error("Já existe uma transferência de usuário principal em andamento.", 409);
  const now = new Date().toISOString();
  const transfer = { id: crypto.randomUUID(), companyId: company.id, companyName: company.companyName, currentPrimaryUserId: currentPrimary.userId, currentPrimaryName: currentPrimary.name, currentPrimaryEmail: currentPrimary.email, newPrimaryUserId: newPrimary.userId, newPrimaryName: newPrimary.name, newPrimaryEmail: newPrimary.email, initiatedBy: "company", requestedByUserId: session.userId || currentPrimary.userId, status: "awaiting_confirmation", requestedAt: now };
  const confirmationLink = await createConfirmation(context.env, transfer, context.request.url);
  await context.env.CADASTROS.put(`transferencia-principal:${transfer.id}`, JSON.stringify(transfer));
  await context.env.CADASTROS.put(`cadastro:${company.id}:dados`, JSON.stringify({ ...company, primaryTransfer: { id: transfer.id, status: transfer.status, newPrimaryName: newPrimary.name, requestedAt: now } }));
  return Response.json({ transfer: publicTransfer(transfer), confirmationLink, message: "Solicitação criada. O novo principal deve confirmar pelo link seguro." }, { status: 201, headers: { "Cache-Control": "no-store" } });
}

export function onRequest() {
  return new Response("Método não permitido.", { status: 405, headers: { Allow: "POST" } });
}
