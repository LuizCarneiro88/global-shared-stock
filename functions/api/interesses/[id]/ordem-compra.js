import { getSession } from "../../../_auth.js";
import { MAX_CERTIFICATE_SIZE, safeFilename, validFileType } from "../../../_material-files.js";
import { INTEREST_ID_PATTERN, effectiveAgreementTerms, purchaseOrderFileResponse, purchaseOrderObjectKey } from "../../../_commission.js";

function error(message, status = 400) {
  return Response.json({ message }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function onRequestPost(context) {
  if (!context.env.CADASTROS || !context.env.MATERIAL_FILES) return error("O armazenamento de arquivos ainda não está configurado.", 503);
  const session = await getSession(context.request, context.env);
  if (session?.role !== "company") return error("Acesso da empresa vendedora necessário.", 401);
  const id = String(context.params.id || "");
  if (!INTEREST_ID_PATTERN.test(id)) return error("Negociação inválida.");
  const key = `interesse:${id}`;
  const interest = await context.env.CADASTROS.get(key, "json");
  if (!interest || interest.sellerCompanyId !== session.companyId) return error("Somente a empresa vendedora pode enviar a Ordem de Compra.", 403);
  if (!["agreement_confirmed", "commission_po_correction_requested"].includes(interest.status)) return error("A Ordem de Compra não pode ser enviada nesta etapa.", 409);
  let formData;
  try { formData = await context.request.formData(); } catch { return error("Não foi possível ler o documento."); }
  if (formData.get("termAccepted") !== "yes") return error("Aceite o termo de comissão para continuar.");
  const file = formData.get("file");
  if (!(file instanceof File) || file.size <= 0) return error("Anexe a Ordem de Compra.");
  if (file.size > MAX_CERTIFICATE_SIZE) return error("A Ordem de Compra pode ter no máximo 10 MB.");
  if (!(await validFileType(file, "certificate"))) return error("Envie a Ordem de Compra em PDF, JPG, PNG ou WebP.");
  const terms = effectiveAgreementTerms(interest);
  if (!terms) return error("Não foi possível calcular as condições do acordo.", 409);
  const fileId = crypto.randomUUID();
  const metadata = { id: fileId, name: safeFilename(file.name), type: file.type, size: file.size, uploadedAt: new Date().toISOString() };
  const objectKey = purchaseOrderObjectKey(id, fileId);
  try {
    await context.env.MATERIAL_FILES.put(objectKey, file, { httpMetadata: { contentType: file.type } });
    const history = interest.commissionPurchaseOrder && interest.status === "commission_po_correction_requested"
      ? [...(interest.commissionPurchaseOrderHistory || []), interest.commissionPurchaseOrder]
      : interest.commissionPurchaseOrderHistory || [];
    const commissionPurchaseOrder = { ...metadata, ...terms, termAcceptedAt: new Date().toISOString(), status: "submitted" };
    const updated = { ...interest, status: "commission_po_submitted", commissionPurchaseOrder, commissionPurchaseOrderHistory: history, commissionCorrectionReason: "" };
    await context.env.CADASTROS.put(key, JSON.stringify(updated));
    if (interest.commissionPurchaseOrder?.id) await context.env.MATERIAL_FILES.delete(purchaseOrderObjectKey(id, interest.commissionPurchaseOrder.id));
    return Response.json({ success: true, commissionPurchaseOrder, message: "Ordem de Compra enviada para validação administrativa." }, { status: 201, headers: { "Cache-Control": "private, no-store" } });
  } catch {
    await context.env.MATERIAL_FILES.delete(objectKey);
    return error("Não foi possível salvar a Ordem de Compra.", 500);
  }
}

export async function onRequestGet(context) {
  if (!context.env.CADASTROS || !context.env.MATERIAL_FILES) return new Response("Armazenamento não configurado.", { status: 503 });
  const session = await getSession(context.request, context.env);
  const id = String(context.params.id || "");
  if (!INTEREST_ID_PATTERN.test(id)) return new Response("Negociação inválida.", { status: 400 });
  const interest = await context.env.CADASTROS.get(`interesse:${id}`, "json");
  if (!interest || !(session?.role === "admin" || (session?.role === "company" && interest.sellerCompanyId === session.companyId))) return new Response("Acesso não autorizado.", { status: 403 });
  const metadata = interest.commissionPurchaseOrder;
  const object = metadata ? await context.env.MATERIAL_FILES.get(purchaseOrderObjectKey(id, metadata.id)) : null;
  return purchaseOrderFileResponse(object, metadata);
}

export function onRequest() {
  return new Response("Método não permitido.", { status: 405, headers: { Allow: "GET, POST" } });
}
