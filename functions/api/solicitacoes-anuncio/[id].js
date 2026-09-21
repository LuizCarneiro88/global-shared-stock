import { getSession } from "../../_auth.js";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ACTIVE_INTEREST_STATUSES = new Set(["received", "resubmitted", "in_intermediation", "awaiting_seller", "seller_response_received", "seller_correction_requested", "response_shared", "buyer_accepted", "buyer_adjustment_requested", "buyer_adjustment_correction_requested", "seller_adjustment_requested", "seller_adjustment_response_received", "agreement_confirmed", "commission_po_submitted", "commission_po_correction_requested", "commission_secured"]);

function error(message, status = 400) {
  return Response.json({ message }, { status, headers: { "Cache-Control": "no-store" } });
}

async function hasActiveInterest(env, materialId) {
  let cursor;
  do {
    const page = await env.CADASTROS.list({ prefix: "interesse:", cursor });
    const records = await Promise.all(page.keys.map((key) => env.CADASTROS.get(key.name, "json")));
    if (records.some((item) => item?.materialId === materialId && ACTIVE_INTEREST_STATUSES.has(item.status))) return true;
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);
  return false;
}

function buildUpdatedAdvertisement(advertisement, material, now) {
  const available = Math.max(0, Number(material.quantityCurrent) - Number(material.quantityReserved || 0) - Number(material.quantitySold || 0));
  return {
    ...advertisement,
    description: material.description,
    partNumber: material.partNumber,
    manufacturer: material.manufacturer,
    condition: material.condition,
    quantity: available,
    quantityAvailable: available,
    hasCertificate: material.hasCertificate,
    files: (material.files || []).filter((file) => file.kind === "photo"),
    coverPhotoId: material.coverPhotoId,
    unitPriceCents: material.unitPriceCents,
    status: "published",
    publishedAt: now,
    updatedAt: now,
  };
}

export async function onRequestPatch(context) {
  if (!context.env.CADASTROS) return error("O armazenamento ainda não está configurado.", 503);
  const session = await getSession(context.request, context.env);
  if (session?.role !== "admin") return error("Acesso administrativo necessário.", 403);
  const id = String(context.params.id || "");
  if (!UUID_PATTERN.test(id)) return error("Solicitação inválida.");
  let input;
  try { input = await context.request.json(); }
  catch { return error("Não foi possível ler a decisão."); }
  if (!["approve", "return"].includes(input.decision)) return error("Decisão inválida.");
  const reason = String(input.reason || "").trim().replace(/\s+/g, " ").slice(0, 800);
  if (input.decision === "return" && reason.length < 10) return error("Explique o motivo da devolução com pelo menos 10 caracteres.");

  const requestKey = `solicitacao-anuncio:${id}`;
  const request = await context.env.CADASTROS.get(requestKey, "json");
  if (!request) return error("Solicitação não encontrada.", 404);
  if (request.status !== "pending") return error("Esta solicitação já foi analisada.", 409);
  const materialKey = `material:${request.companyId}:${request.materialId}`;
  const advertisementKey = `anuncio:${request.materialId}`;
  const [material, advertisement] = await Promise.all([
    context.env.CADASTROS.get(materialKey, "json"),
    context.env.CADASTROS.get(advertisementKey, "json"),
  ]);
  if (!material || !advertisement) return error("Material ou anúncio não encontrado.", 404);
  const now = new Date().toISOString();

  if (input.decision === "return") {
    const reviewed = { ...request, status: "returned", reviewReason: reason, reviewedAt: now, reviewedBy: session.email };
    const summary = { id, type: request.type, reason: request.reason, status: "returned", reviewReason: reason, createdAt: request.createdAt, reviewedAt: now };
    try {
      await context.env.CADASTROS.put(requestKey, JSON.stringify(reviewed));
      await context.env.CADASTROS.put(materialKey, JSON.stringify({ ...material, advertisementRequest: summary, updatedAt: now }));
      return Response.json({ request: reviewed, message: "Solicitação devolvida à empresa com a orientação informada." }, { headers: { "Cache-Control": "no-store" } });
    } catch { return error("Não foi possível devolver a solicitação.", 500); }
  }

  let updatedMaterial = { ...material };
  let updatedAdvertisement = { ...advertisement };
  if (request.type === "change") {
    const proposal = request.proposal;
    const committed = Math.max(0, Number(material.quantityReserved) || 0) + Math.max(0, Number(material.quantitySold) || 0);
    if (!proposal || Number(proposal.quantityCurrent) < committed) return error(`A quantidade proposta ficou abaixo das ${committed} unidades já comprometidas. Devolva a solicitação para ajuste.`, 409);
    const existingPhotos = (material.files || []).filter((file) => file.kind === "photo");
    const existingCertificate = (material.files || []).find((file) => file.kind === "certificate");
    const proposedPhotos = (request.proposedFiles || []).filter((file) => file.kind === "photo");
    const proposedCertificate = (request.proposedFiles || []).find((file) => file.kind === "certificate");
    const photos = proposal.replacePhotos ? proposedPhotos : existingPhotos;
    const certificate = proposal.certificateAction === "replace" ? proposedCertificate : proposal.certificateAction === "remove" ? null : existingCertificate;
    const files = [...photos, ...(certificate ? [certificate] : [])];
    const quantityCurrent = Number(proposal.quantityCurrent);
    const unitPriceCents = Number(proposal.unitPriceCents);
    const unitCommissionCents = Math.round(unitPriceCents / 10);
    const totalPriceCents = Math.round(quantityCurrent * unitPriceCents);
    const versions = [...(Array.isArray(material.versionHistory) ? material.versionHistory : []), { version: material.version || 1, savedAt: now, data: { partNumber: material.partNumber, manufacturer: material.manufacturer, description: material.description, condition: material.condition, quantityCurrent: material.quantityCurrent, unitPriceCents: material.unitPriceCents, files: material.files, coverPhotoId: material.coverPhotoId } }];
    updatedMaterial = { ...material, ...proposal, files, hasCertificate: Boolean(certificate), coverPhotoId: photos[0]?.id || "", quantity: quantityCurrent, quantityCurrent, quantityAvailable: Math.max(0, quantityCurrent - committed), unitCommissionCents, unitNetCents: unitPriceCents - unitCommissionCents, totalPriceCents, totalCommissionCents: Math.round(totalPriceCents / 10), totalNetCents: totalPriceCents - Math.round(totalPriceCents / 10), version: Number(material.version || 1) + 1, versionHistory: versions, advertisementStatus: "published" };
    delete updatedMaterial.replacePhotos;
    delete updatedMaterial.certificateAction;
    updatedAdvertisement = buildUpdatedAdvertisement(updatedAdvertisement, updatedMaterial, now);
  } else if (request.type === "suspend") {
    updatedAdvertisement = { ...advertisement, status: "suspended", suspendedAt: now, suspensionReason: request.reason };
    updatedMaterial = { ...material, advertisementStatus: "suspended" };
  } else if (request.type === "withdraw") {
    if (Number(material.quantityReserved || 0) > 0 || await hasActiveInterest(context.env, request.materialId)) return error("O anúncio possui reserva ou negociação ativa e não pode ser retirado. Encerre essas operações antes da retirada.", 409);
    updatedAdvertisement = { ...advertisement, status: "withdrawn", withdrawnAt: now, withdrawalReason: request.reason };
    updatedMaterial = { ...material, advertisementStatus: "withdrawn" };
  } else if (request.type === "reactivate") {
    if (Number(material.quantityAvailable ?? material.quantityCurrent) <= 0) return error("O anúncio não possui quantidade disponível para reativação.", 409);
    updatedAdvertisement = { ...advertisement, status: "published", reactivatedAt: now, updatedAt: now };
    updatedMaterial = { ...material, advertisementStatus: "published" };
  }

  const reviewed = { ...request, status: "approved", reviewedAt: now, reviewedBy: session.email };
  const summary = { id, type: request.type, reason: request.reason, status: "approved", createdAt: request.createdAt, reviewedAt: now };
  updatedMaterial = { ...updatedMaterial, advertisementRequest: summary, updatedAt: now };
  try {
    await context.env.CADASTROS.put(advertisementKey, JSON.stringify(updatedAdvertisement));
    await context.env.CADASTROS.put(materialKey, JSON.stringify(updatedMaterial));
    await context.env.CADASTROS.put(requestKey, JSON.stringify(reviewed));
    return Response.json({ request: reviewed, message: "Solicitação aprovada e anúncio atualizado." }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    await context.env.CADASTROS.put(advertisementKey, JSON.stringify(advertisement));
    await context.env.CADASTROS.put(materialKey, JSON.stringify(material));
    return error("Não foi possível aplicar a decisão. Nenhuma alteração foi mantida.", 500);
  }
}

export function onRequest() {
  return new Response("Método não permitido.", { status: 405, headers: { Allow: "PATCH" } });
}
