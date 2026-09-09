import { getSession } from "../../../_auth.js";
import { INTEREST_ID_PATTERN } from "../../../_commission.js";

const TERMS_VERSION = "MINUTA-0.1";

function error(message, status = 400) {
  return Response.json({ message }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function onRequestPost(context) {
  if (!context.env.CADASTROS) return error("O armazenamento ainda não está configurado.", 503);
  const session = await getSession(context.request, context.env);
  if (session?.role !== "company") return error("Acesso da empresa vendedora necessário.", 401);
  const id = String(context.params.id || "");
  if (!INTEREST_ID_PATTERN.test(id)) return error("Negociação inválida.");
  const key = `interesse:${id}`;
  const interest = await context.env.CADASTROS.get(key, "json");
  if (!interest || interest.sellerCompanyId !== session.companyId) return error("Somente a empresa vendedora pode registrar a leitura.", 403);
  if (!["agreement_confirmed", "commission_po_correction_requested"].includes(interest.status)) return error("Os termos não podem ser aceitos nesta etapa.", 409);
  let input;
  try { input = await context.request.json(); } catch { return error("Não foi possível registrar a leitura."); }
  const action = String(input.action || "");
  const now = new Date().toISOString();
  const previous = interest.termsReading?.version === TERMS_VERSION ? interest.termsReading : {};
  if (action === "opened") {
    const updated = { ...interest, termsReading: { ...previous, version: TERMS_VERSION, openedAt: previous.openedAt || now } };
    await context.env.CADASTROS.put(key, JSON.stringify(updated));
    return Response.json({ success: true, termsReading: updated.termsReading }, { headers: { "Cache-Control": "private, no-store" } });
  }
  if (action === "read_to_end") {
    const updated = { ...interest, termsReading: { ...previous, version: TERMS_VERSION, openedAt: previous.openedAt || now, readToEndAt: previous.readToEndAt || now } };
    await context.env.CADASTROS.put(key, JSON.stringify(updated));
    return Response.json({ success: true, termsReading: updated.termsReading }, { headers: { "Cache-Control": "private, no-store" } });
  }
  return error("Ação de leitura inválida.");
}

export function onRequest() {
  return new Response("Método não permitido.", { status: 405, headers: { Allow: "POST" } });
}
