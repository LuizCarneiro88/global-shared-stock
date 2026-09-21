import { tokenHash } from "../../_primary-transfer.js";

function error(message, status = 400) {
  return Response.json({ message }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function onRequestPost(context) {
  if (!context.env.CADASTROS) return error("O armazenamento ainda não está configurado.", 503);
  let input;
  try { input = await context.request.json(); }
  catch { return error("Não foi possível ler a confirmação."); }
  const token = String(input.token || "");
  if (!token) return error("Link de confirmação inválido.");
  const hash = await tokenHash(token);
  const tokenKey = `transferencia-principal-token:${hash}`;
  const confirmation = await context.env.CADASTROS.get(tokenKey, "json");
  if (!confirmation || confirmation.expiresAt <= Date.now()) return error("Este link expirou ou já foi utilizado.", 410);
  const transferKey = `transferencia-principal:${confirmation.transferId}`;
  const transfer = await context.env.CADASTROS.get(transferKey, "json");
  if (!transfer || transfer.status !== "awaiting_confirmation" || transfer.newPrimaryUserId !== confirmation.newPrimaryUserId) return error("Esta transferência não está mais disponível.", 409);
  const user = await context.env.CADASTROS.get(`usuario:${transfer.newPrimaryUserId}`, "json");
  if (!user?.emailConfirmedAt || !user.active) return error("O acesso do novo principal não está ativo.", 409);
  const now = new Date().toISOString();
  const updated = { ...transfer, status: "awaiting_admin", newPrimaryConfirmedAt: now };
  await context.env.CADASTROS.put(transferKey, JSON.stringify(updated));
  const companyKey = `cadastro:${transfer.companyId}:dados`;
  const company = await context.env.CADASTROS.get(companyKey, "json");
  if (company) await context.env.CADASTROS.put(companyKey, JSON.stringify({ ...company, primaryTransfer: { id: transfer.id, status: updated.status, newPrimaryName: transfer.newPrimaryName, requestedAt: transfer.requestedAt, confirmedAt: now } }));
  await context.env.CADASTROS.delete(tokenKey);
  return Response.json({ success: true, message: "Aceite confirmado. A transferência aguarda aprovação administrativa." }, { headers: { "Cache-Control": "no-store" } });
}

export function onRequest() {
  return new Response("Método não permitido.", { status: 405, headers: { Allow: "POST" } });
}
