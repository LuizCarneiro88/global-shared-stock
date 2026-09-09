import { safeFilename } from "./_material-files.js";

export const INTEREST_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const MAX_PURCHASE_ORDER_SIZE = 10 * 1024 * 1024;

export function purchaseOrderObjectKey(interestId, fileId) {
  return `commission-orders/${interestId}/${fileId}`;
}

export function effectiveAgreementTerms(interest) {
  const base = interest.sellerResponse;
  if (!base) return null;
  const counter = interest.sellerAdjustmentResponse?.type === "counter" ? interest.sellerAdjustmentResponse : null;
  const acceptedAdjustment = interest.sellerAdjustmentResponse?.type === "accepted" && interest.buyerDecision?.type === "adjustment_requested" ? interest.buyerDecision : null;
  const current = counter || base;
  const quantity = Number(acceptedAdjustment?.requestedQuantity || current.confirmedQuantity);
  const unitPriceCents = Number(acceptedAdjustment?.requestedUnitPriceCents || current.confirmedUnitPriceCents);
  const deadline = acceptedAdjustment?.requestedDeadline || current.availabilityDeadline;
  if (!Number.isFinite(quantity) || quantity <= 0 || !Number.isInteger(unitPriceCents) || unitPriceCents <= 0) return null;
  const totalCents = Math.round(quantity * unitPriceCents);
  const commissionCents = Math.round(totalCents * 0.1);
  return { quantity, unitPriceCents, totalCents, commissionCents, sellerNetCents: totalCents - commissionCents, deadline };
}

export function purchaseOrderFileResponse(object, metadata) {
  if (!object || !metadata) return new Response("Ordem de Compra não encontrada.", { status: 404 });
  return new Response(object.body, { headers: { "Content-Type": metadata.type, "Content-Disposition": `inline; filename="${safeFilename(metadata.name)}"`, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
}
