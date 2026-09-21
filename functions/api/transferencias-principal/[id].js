import { getSession } from "../../_auth.js";
import { TRANSFER_ID_PATTERN, publicTransfer } from "../../_primary-transfer.js";

function error(message, status = 400) {
  return Response.json({ message }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function onRequestPatch(context) {
  if (!context.env.CADASTROS) return error("O armazenamento ainda não está configurado.", 503);
  const session = await getSession(context.request, context.env);
  if (session?.role !== "admin") return error("Acesso administrativo necessário.", 403);
  const id = String(context.params.id || "");
  if (!TRANSFER_ID_PATTERN.test(id)) return error("Transferência inválida.");
  let input;
  try { input = await context.request.json(); }
  catch { return error("Não foi possível ler a decisão."); }
  if (!["approve", "return"].includes(input.decision)) return error("Decisão inválida.");
  const reason = String(input.reason || "").trim().replace(/\s+/g, " ").slice(0, 800);
  if (input.decision === "return" && reason.length < 10) return error("Explique o motivo da devolução com pelo menos 10 caracteres.");
  const transferKey = `transferencia-principal:${id}`;
  const transfer = await context.env.CADASTROS.get(transferKey, "json");
  if (!transfer) return error("Transferência não encontrada.", 404);
  if (transfer.status !== "awaiting_admin") return error("A transferência precisa ser confirmada pelo novo principal antes da decisão administrativa.", 409);
  const companyKey = `cadastro:${transfer.companyId}:dados`;
  const [company, currentPrimary, newPrimary] = await Promise.all([
    context.env.CADASTROS.get(companyKey, "json"),
    context.env.CADASTROS.get(`usuario:${transfer.currentPrimaryUserId}`, "json"),
    context.env.CADASTROS.get(`usuario:${transfer.newPrimaryUserId}`, "json"),
  ]);
  if (!company || !currentPrimary || !newPrimary) return error("Os usuários envolvidos não foram encontrados.", 409);
  const now = new Date().toISOString();
  if (input.decision === "return") {
    const updated = { ...transfer, status: "returned", reviewReason: reason, reviewedAt: now, reviewedBy: session.email };
    await context.env.CADASTROS.put(transferKey, JSON.stringify(updated));
    await context.env.CADASTROS.put(companyKey, JSON.stringify({ ...company, primaryTransfer: { id, status: "returned", newPrimaryName: transfer.newPrimaryName, reviewReason: reason, reviewedAt: now } }));
    return Response.json({ transfer: publicTransfer(updated), message: "Transferência devolvida com a orientação informada." }, { headers: { "Cache-Control": "no-store" } });
  }
  if (currentPrimary.role !== "primary" || newPrimary.role !== "additional") return error("Os papéis dos usuários mudaram. Revise a solicitação.", 409);
  const previousCurrent = { ...currentPrimary };
  const previousNew = { ...newPrimary };
  const updatedCurrent = { ...currentPrimary, role: "additional", primaryApprovedAt: now, updatedAt: now };
  const updatedNew = { ...newPrimary, role: "primary", primaryApprovedAt: now, active: true, updatedAt: now };
  const updatedTransfer = { ...transfer, status: "approved", approvedAt: now, approvedBy: session.email };
  const history = [...(Array.isArray(company.primaryTransferHistory) ? company.primaryTransferHistory : []), { transferId: id, previousPrimaryUserId: currentPrimary.userId, newPrimaryUserId: newPrimary.userId, initiatedBy: transfer.initiatedBy, requestedAt: transfer.requestedAt, confirmedAt: transfer.newPrimaryConfirmedAt, approvedAt: now, approvedBy: session.email, exceptionalReason: transfer.exceptionalReason || "" }];
  const updatedCompany = { ...company, primaryUserId: newPrimary.userId, primaryUserName: newPrimary.name, primaryUserEmail: newPrimary.email, primaryTransfer: { id, status: "approved", newPrimaryName: newPrimary.name, approvedAt: now }, primaryTransferHistory: history };
  try {
    await context.env.CADASTROS.put(`usuario:${currentPrimary.userId}`, JSON.stringify(updatedCurrent));
    await context.env.CADASTROS.put(`usuario:${newPrimary.userId}`, JSON.stringify(updatedNew));
    await context.env.CADASTROS.put(companyKey, JSON.stringify(updatedCompany));
    await context.env.CADASTROS.put(transferKey, JSON.stringify(updatedTransfer));
    return Response.json({ transfer: publicTransfer(updatedTransfer), message: "Transferência aprovada. O novo usuário principal já está ativo." }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    await context.env.CADASTROS.put(`usuario:${currentPrimary.userId}`, JSON.stringify(previousCurrent));
    await context.env.CADASTROS.put(`usuario:${newPrimary.userId}`, JSON.stringify(previousNew));
    await context.env.CADASTROS.put(companyKey, JSON.stringify(company));
    return error("Não foi possível concluir a transferência. Os papéis anteriores foram preservados.", 500);
  }
}

export function onRequest() {
  return new Response("Método não permitido.", { status: 405, headers: { Allow: "PATCH" } });
}
