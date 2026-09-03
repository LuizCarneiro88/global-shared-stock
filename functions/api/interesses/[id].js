import { getSession } from "../../_auth.js";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DECISIONS = new Set(["in_intermediation", "rejected"]);
const DEADLINES = new Set(["immediate", "7_days", "15_days", "30_days", "flexible"]);
const SUBJECTS = new Set(["availability", "technical", "commercial", "documentation", "other"]);
const AVAILABILITY = new Set(["available", "partial", "unavailable"]);
const SELLER_DEADLINES = new Set(["immediate", "7_days", "15_days", "30_days", "over_30_days", "not_applicable"]);
const ADJUSTMENT_TOPICS = new Set(["quantity", "price", "deadline", "documentation"]);

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
    if (interest.sellerCompanyId === session.companyId && interest.status === "seller_adjustment_requested") {
      const sellerAdjustmentAction = String(input.sellerAdjustmentAction || "");
      const decidedAt = new Date().toISOString();
      if (sellerAdjustmentAction === "accept") {
        const updated = { ...interest, status: "seller_adjustment_response_received", sellerAdjustmentResponse: { type: "accepted", decidedAt } };
        await context.env.CADASTROS.put(key, JSON.stringify(updated));
        const { sellerCompanyId, buyerCompanyId, buyerDecision, ...safeInterest } = updated;
        return Response.json({ success: true, interest: safeInterest, message: "Ajuste aceito e enviado para análise administrativa." }, { headers: { "Cache-Control": "no-store" } });
      }
      if (sellerAdjustmentAction === "reject") {
        const reason = String(input.reason || "").trim().replace(/\s+/g, " ").slice(0, 500);
        if (!reason) return error("Informe o motivo da recusa.");
        if (containsDirectContact(reason)) return error("O motivo não pode conter e-mail, telefone ou link.");
        const updated = { ...interest, status: "seller_adjustment_response_received", sellerAdjustmentResponse: { type: "rejected", reason, decidedAt } };
        await context.env.CADASTROS.put(key, JSON.stringify(updated));
        const { sellerCompanyId, buyerCompanyId, buyerDecision, ...safeInterest } = updated;
        return Response.json({ success: true, interest: safeInterest, message: "Recusa enviada para análise administrativa." }, { headers: { "Cache-Control": "no-store" } });
      }
      if (sellerAdjustmentAction === "counter") {
        const confirmedQuantity = Number(input.confirmedQuantity);
        const confirmedUnitPriceCents = Number(input.confirmedUnitPriceCents);
        const availabilityDeadline = String(input.availabilityDeadline || "");
        const documentationAvailable = String(input.documentationAvailable || "");
        const note = String(input.note || "").trim().replace(/\s+/g, " ").slice(0, 800);
        if (!Number.isFinite(confirmedQuantity) || confirmedQuantity <= 0 || confirmedQuantity > Number(interest.sellerResponse.confirmedQuantity)) return error("Informe uma quantidade válida para a contraproposta.");
        if (!Number.isInteger(confirmedUnitPriceCents) || confirmedUnitPriceCents <= 0) return error("Informe um preço válido para a contraproposta.");
        if (!SELLER_DEADLINES.has(availabilityDeadline) || availabilityDeadline === "not_applicable") return error("Selecione um prazo válido.");
        if (!["yes", "no"].includes(documentationAvailable)) return error("Informe se a documentação está disponível.");
        if (!note) return error("Explique a contraproposta.");
        if (containsDirectContact(note)) return error("A contraproposta não pode conter e-mail, telefone ou link.");
        const sellerAdjustmentResponse = { type: "counter", confirmedQuantity, confirmedUnitPriceCents, availabilityDeadline, documentationAvailable, note, decidedAt };
        const updated = { ...interest, status: "seller_adjustment_response_received", sellerAdjustmentResponse };
        await context.env.CADASTROS.put(key, JSON.stringify(updated));
        const { sellerCompanyId, buyerCompanyId, buyerDecision, ...safeInterest } = updated;
        return Response.json({ success: true, interest: safeInterest, message: "Contraproposta enviada para análise administrativa." }, { headers: { "Cache-Control": "no-store" } });
      }
      return error("Selecione uma resposta válida para o pedido de ajuste.");
    }
    if (interest.buyerCompanyId !== session.companyId) return error("Somente a empresa responsável por esta etapa pode atualizar a solicitação.", 403);
    if (["response_shared", "buyer_adjustment_correction_requested"].includes(interest.status)) {
      const buyerAction = String(input.buyerAction || "");
      const decidedAt = new Date().toISOString();
      if (interest.status === "buyer_adjustment_correction_requested" && buyerAction !== "request_adjustment") return error("Corrija e reenvie o pedido de ajuste.");
      if (buyerAction === "accept") {
        const updated = { ...interest, status: "buyer_accepted", buyerDecision: { type: "accepted", decidedAt } };
        await context.env.CADASTROS.put(key, JSON.stringify(updated));
        const { sellerCompanyId, buyerCompanyId, sellerResponseHistory, sellerCorrectionReason, ...safeInterest } = updated;
        return Response.json({ success: true, interest: safeInterest, message: "Condições aceitas. A Global Shared Stock seguirá com a formalização." }, { headers: { "Cache-Control": "no-store" } });
      }
      if (buyerAction === "reject") {
        const reason = String(input.reason || "").trim().replace(/\s+/g, " ").slice(0, 500);
        if (!reason) return error("Informe o motivo da recusa.");
        if (containsDirectContact(reason)) return error("O motivo não pode conter e-mail, telefone ou link.");
        const updated = { ...interest, status: "closed_no_sale", buyerDecision: { type: "rejected", reason, decidedAt } };
        await context.env.CADASTROS.put(key, JSON.stringify(updated));
        const { sellerCompanyId, buyerCompanyId, sellerResponseHistory, sellerCorrectionReason, ...safeInterest } = updated;
        return Response.json({ success: true, interest: safeInterest, message: "Condições recusadas. A negociação foi encerrada sem venda." }, { headers: { "Cache-Control": "no-store" } });
      }
      if (buyerAction === "request_adjustment") {
        const topics = [...new Set(Array.isArray(input.topics) ? input.topics.map(String) : [])];
        const note = String(input.note || "").trim().replace(/\s+/g, " ").slice(0, 800);
        if (!topics.length || topics.some((topic) => !ADJUSTMENT_TOPICS.has(topic))) return error("Selecione ao menos um item para ajuste.");
        if (!note) return error("Explique o ajuste solicitado.");
        if (containsDirectContact(note)) return error("A solicitação não pode conter e-mail, telefone ou link.");
        const requestedQuantity = topics.includes("quantity") ? Number(input.requestedQuantity) : null;
        const requestedUnitPriceCents = topics.includes("price") ? Number(input.requestedUnitPriceCents) : null;
        const requestedDeadline = topics.includes("deadline") ? String(input.requestedDeadline || "") : "";
        if (topics.includes("quantity") && (!Number.isFinite(requestedQuantity) || requestedQuantity <= 0)) return error("Informe a quantidade desejada.");
        if (topics.includes("quantity") && requestedQuantity > Number(interest.sellerResponse.confirmedQuantity)) return error("A quantidade solicitada não pode superar a quantidade confirmada pelo vendedor.");
        if (topics.includes("price") && (!Number.isInteger(requestedUnitPriceCents) || requestedUnitPriceCents <= 0)) return error("Informe o preço desejado.");
        if (topics.includes("deadline") && (!SELLER_DEADLINES.has(requestedDeadline) || requestedDeadline === "not_applicable")) return error("Selecione o prazo desejado.");
        const buyerDecision = { type: "adjustment_requested", topics, note, requestedQuantity, requestedUnitPriceCents, requestedDeadline, decidedAt };
        const buyerDecisionHistory = interest.status === "buyer_adjustment_correction_requested" && interest.buyerDecision
          ? [...(Array.isArray(interest.buyerDecisionHistory) ? interest.buyerDecisionHistory : []), { ...interest.buyerDecision, correctionReason: interest.buyerAdjustmentCorrectionReason || "" }]
          : interest.buyerDecisionHistory || [];
        const updated = { ...interest, status: "buyer_adjustment_requested", buyerDecision, buyerDecisionHistory, buyerAdjustmentCorrectionReason: "" };
        await context.env.CADASTROS.put(key, JSON.stringify(updated));
        const { sellerCompanyId, buyerCompanyId, sellerResponseHistory, sellerCorrectionReason, ...safeInterest } = updated;
        return Response.json({ success: true, interest: safeInterest, message: "Pedido de ajuste enviado para análise da Global Shared Stock." }, { headers: { "Cache-Control": "no-store" } });
      }
      return error("Selecione uma decisão válida.");
    }
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
  if (status === "seller_adjustment_requested") {
    if (interest.status !== "buyer_adjustment_requested" || interest.buyerDecision?.type !== "adjustment_requested") return error("Não há um pedido de ajuste pronto para encaminhar.", 409);
    const updated = { ...interest, status: "seller_adjustment_requested", buyerAdjustmentSharedAt: new Date().toISOString() };
    await context.env.CADASTROS.put(key, JSON.stringify(updated));
    return Response.json({ success: true, interest: updated }, { headers: { "Cache-Control": "no-store" } });
  }
  if (status === "buyer_adjustment_correction_requested") {
    const buyerAdjustmentCorrectionReason = String(input.buyerAdjustmentCorrectionReason || "").trim().replace(/\s+/g, " ").slice(0, 500);
    if (interest.status !== "buyer_adjustment_requested") return error("Não há um pedido de ajuste para devolver.", 409);
    if (!buyerAdjustmentCorrectionReason) return error("Informe o motivo da correção.");
    const updated = { ...interest, status: "buyer_adjustment_correction_requested", buyerAdjustmentCorrectionReason, buyerAdjustmentCorrectionRequestedAt: new Date().toISOString() };
    await context.env.CADASTROS.put(key, JSON.stringify(updated));
    return Response.json({ success: true, interest: updated }, { headers: { "Cache-Control": "no-store" } });
  }
  if (status === "agreement_confirmed") {
    if (interest.status !== "seller_adjustment_response_received" || interest.sellerAdjustmentResponse?.type !== "accepted") return error("Não há um ajuste aceito pronto para confirmação.", 409);
    const updated = { ...interest, status: "agreement_confirmed", agreementConfirmedAt: new Date().toISOString() };
    await context.env.CADASTROS.put(key, JSON.stringify(updated));
    return Response.json({ success: true, interest: updated, message: "Acordo confirmado. A negociação seguirá para formalização." }, { headers: { "Cache-Control": "no-store" } });
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
