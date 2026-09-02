import { getSession } from "../../_auth.js";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DECISIONS = new Set(["in_intermediation", "rejected"]);
const DEADLINES = new Set(["immediate", "7_days", "15_days", "30_days", "flexible"]);
const SUBJECTS = new Set(["availability", "technical", "commercial", "documentation", "other"]);
const AVAILABILITY = new Set(["available", "partial", "unavailable"]);
const SELLER_DEADLINES = new Set(["immediate", "7_days", "15_days", "30_days", "over_30_days", "not_applicable"]);

function error(message, status = 400) {
  return Response.json({ message }, { status, headers: { "Cache-Control": "no-store" } });
}

function containsDirectContact(value) {
  return /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(value) || /(https?:\/\/|www\.|\.com(?:\.br)?\b)/i.test(value) || /(?:\d[\s().+-]*){8,}/.test(value);
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
    if (interest.sellerCompanyId === session.companyId && ["awaiting_seller", "seller_correction_requested"].includes(interest.status)) {
      const availability = String(input.availability || "");
      const confirmedQuantity = Number(input.confirmedQuantity);
      const availabilityDeadline = String(input.availabilityDeadline || "");
      const confirmedUnitPriceCents = Number(input.confirmedUnitPriceCents);
      const documentationAvailable = String(input.documentationAvailable || "");
      const note = String(input.note || "").trim().replace(/\s+/g, " ").slice(0, 800);
      if (!AVAILABILITY.has(availability)) return error("Confirme a disponibilidade do material.");
      if (!Number.isFinite(confirmedQuantity) || confirmedQuantity < 0 || (availability !== "unavailable" && confirmedQuantity <= 0)) return error("Informe uma quantidade confirmada válida.");
      if (availability === "unavailable" && confirmedQuantity !== 0) return error("Para material indisponível, informe quantidade zero.");
      if (confirmedQuantity > Number(interest.quantity)) return error("A quantidade confirmada não pode superar a quantidade solicitada.");
      if (!SELLER_DEADLINES.has(availabilityDeadline)) return error("Selecione um prazo de disponibilização válido.");
      if (!Number.isInteger(confirmedUnitPriceCents) || confirmedUnitPriceCents < 0 || (availability !== "unavailable" && confirmedUnitPriceCents <= 0)) return error("Informe um preço final válido.");
      if (availability === "unavailable" && confirmedUnitPriceCents !== 0) return error("Para material indisponível, informe preço zero.");
      if (!["yes", "no"].includes(documentationAvailable)) return error("Informe se a documentação está disponível.");
      if (containsDirectContact(note)) return error("A observação não pode conter e-mail, telefone ou link. A Global Shared Stock preserva o sigilo entre as empresas.");
      const sellerResponse = { availability, confirmedQuantity, availabilityDeadline, confirmedUnitPriceCents, documentationAvailable, note, respondedAt: new Date().toISOString() };
      const sellerResponseHistory = interest.status === "seller_correction_requested" && interest.sellerResponse
        ? [...(Array.isArray(interest.sellerResponseHistory) ? interest.sellerResponseHistory : []), { ...interest.sellerResponse, correctionReason: interest.sellerCorrectionReason || "" }]
        : interest.sellerResponseHistory || [];
      const updated = { ...interest, status: "seller_response_received", sellerResponse, sellerResponseHistory, sellerCorrectionReason: "" };
      await context.env.CADASTROS.put(key, JSON.stringify(updated));
      const { sellerCompanyId, buyerCompanyId, ...safeInterest } = updated;
      return Response.json({ success: true, interest: safeInterest, message: "Resposta enviada para análise da Global Shared Stock." }, { headers: { "Cache-Control": "no-store" } });
    }
    if (interest.buyerCompanyId !== session.companyId) return error("Somente a empresa responsável por esta etapa pode atualizar a solicitação.", 403);
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
  if (status === "awaiting_seller") {
    if (interest.status !== "in_intermediation") return error("A resposta do vendedor só pode ser solicitada em uma negociação aceita.", 409);
    const updated = { ...interest, status: "awaiting_seller", sellerRequestedAt: new Date().toISOString() };
    await context.env.CADASTROS.put(key, JSON.stringify(updated));
    return Response.json({ success: true, interest: updated }, { headers: { "Cache-Control": "no-store" } });
  }
  if (status === "response_shared") {
    if (interest.status !== "seller_response_received" || !interest.sellerResponse) return error("Não há uma resposta do vendedor pronta para encaminhamento.", 409);
    const updated = { ...interest, status: "response_shared", responseSharedAt: new Date().toISOString() };
    await context.env.CADASTROS.put(key, JSON.stringify(updated));
    return Response.json({ success: true, interest: updated }, { headers: { "Cache-Control": "no-store" } });
  }
  if (status === "seller_correction_requested") {
    const sellerCorrectionReason = String(input.sellerCorrectionReason || "").trim().replace(/\s+/g, " ").slice(0, 500);
    if (interest.status !== "seller_response_received" || !interest.sellerResponse) return error("Não há uma resposta do vendedor para devolver.", 409);
    if (!sellerCorrectionReason) return error("Informe o motivo da correção solicitada.");
    const updated = { ...interest, status: "seller_correction_requested", sellerCorrectionReason, sellerCorrectionRequestedAt: new Date().toISOString() };
    await context.env.CADASTROS.put(key, JSON.stringify(updated));
    return Response.json({ success: true, interest: updated }, { headers: { "Cache-Control": "no-store" } });
  }
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
