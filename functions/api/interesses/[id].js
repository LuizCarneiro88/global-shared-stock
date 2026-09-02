import { getSession } from "../../_auth.js";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DECISIONS = new Set(["in_intermediation", "rejected"]);
const DEADLINES = new Set(["immediate", "7_days", "15_days", "30_days", "flexible"]);
const SUBJECTS = new Set(["availability", "technical", "commercial", "documentation", "other"]);

function error(message, status = 400) {
  return Response.json({ message }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function onRequestPatch(context) {
  if (!context.env.CADASTROS) return error("O armazenamento ainda não está configurado.", 503);
  const id = String(context.params.id || "");
  if (!UUID_PATTERN.test(id)) return error("Interesse inválido.");
  const session = await getSession(context.request, context.env);
  let input;
  try { input = await context.request.json(); } catch { return error("Não foi possível ler a decisão."); }
  const key = `interesse:${id}`;
  const interest = await context.env.CADASTROS.get(key, "json");
  if (!interest) return error("Interesse não encontrado.", 404);

  if (session?.role === "company") {
    if (interest.buyerCompanyId !== session.companyId) return error("Somente a empresa interessada pode corrigir esta solicitação.", 403);
    if (interest.status !== "rejected") return error("Somente interesses rejeitados podem ser editados.", 409);
    const quantity = Number(input.quantity);
    const deadline = String(input.deadline || "");
    const subject = String(input.subject || "");
    const note = String(input.note || "").trim().replace(/\s+/g, " ").slice(0, 800);
    if (!Number.isFinite(quantity) || quantity <= 0) return error("Informe uma quantidade maior que zero.");
    if (!DEADLINES.has(deadline)) return error("Selecione um prazo válido.");
    if (!SUBJECTS.has(subject)) return error("Selecione um assunto válido.");
    const advertisement = await context.env.CADASTROS.get(`anuncio:${interest.materialId}`, "json");
    if (!advertisement || advertisement.status !== "published") return error("Este anúncio não está mais disponível.", 404);
    if (quantity > Number(advertisement.quantity)) return error("A quantidade solicitada é maior que a disponibilidade anunciada.");
    const revisedAt = new Date().toISOString();
    const history = [...(Array.isArray(interest.revisionHistory) ? interest.revisionHistory : []), {
      quantity: interest.quantity, deadline: interest.deadline, subject: interest.subject, note: interest.note || "",
      rejectionReason: interest.rejectionReason || "", decidedAt: interest.decidedAt || "", revisedAt,
    }];
    const updated = { ...interest, quantity, deadline, subject, note, status: "resubmitted", rejectionReason: "", decidedAt: "", revisedAt, revisionHistory: history };
    await context.env.CADASTROS.put(key, JSON.stringify(updated));
    const { sellerCompanyId, buyerCompanyId, ...safeInterest } = updated;
    return Response.json({ success: true, interest: safeInterest, message: "Interesse corrigido e reenviado para avaliação." }, { headers: { "Cache-Control": "no-store" } });
  }

  if (session?.role !== "admin") return error("Acesso administrativo necessário.", 403);
  const status = String(input.status || "");
  const rejectionReason = String(input.rejectionReason || "").trim().replace(/\s+/g, " ").slice(0, 500);
  if (!DECISIONS.has(status)) return error("Decisão inválida.");
  if (status === "rejected" && !rejectionReason) return error("Informe o motivo da rejeição.");

  if (!["received", "resubmitted"].includes(interest.status)) return error("Este interesse já foi decidido.", 409);
  const updated = {
    ...interest,
    status,
    rejectionReason: status === "rejected" ? rejectionReason : "",
    decidedAt: new Date().toISOString(),
  };
  await context.env.CADASTROS.put(key, JSON.stringify(updated));
  return Response.json({ success: true, interest: updated }, { headers: { "Cache-Control": "no-store" } });
}

export function onRequest() {
  return new Response("Método não permitido.", { status: 405, headers: { Allow: "PATCH" } });
}
