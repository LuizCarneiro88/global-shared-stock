import { getSession } from "../../_auth.js";
import { MAX_CERTIFICATE_SIZE, MAX_PHOTOS, MAX_PHOTO_SIZE, objectKey, safeFilename, validFileType } from "../../_material-files.js";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const REQUEST_TYPES = new Set(["change", "suspend", "withdraw", "reactivate"]);
const CONDITIONS = new Set(["new", "used", "refurbished", "scrap"]);

function error(message, status = 400) {
  return Response.json({ message }, { status, headers: { "Cache-Control": "no-store" } });
}

function clean(value, maximum) {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, maximum);
}

async function inputFromRequest(request) {
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("multipart/form-data")) return { input: await request.json(), photos: [], certificate: null };
  const form = await request.formData();
  const photos = form.getAll("photos").filter((item) => item instanceof File && item.size > 0);
  const certificateEntry = form.get("certificate");
  return {
    input: JSON.parse(String(form.get("data") || "{}")),
    photos,
    certificate: certificateEntry instanceof File && certificateEntry.size > 0 ? certificateEntry : null,
  };
}

async function validateFiles(photos, certificate) {
  if (photos.length > MAX_PHOTOS) throw new Error("Envie no máximo 6 fotografias.");
  for (const photo of photos) {
    if (photo.size > MAX_PHOTO_SIZE) throw new Error("Cada fotografia pode ter no máximo 8 MB.");
    if (!(await validFileType(photo, "photo"))) throw new Error("Envie fotografias JPG, PNG ou WebP válidas.");
  }
  if (certificate) {
    if (certificate.size > MAX_CERTIFICATE_SIZE) throw new Error("O certificado pode ter no máximo 10 MB.");
    if (!(await validFileType(certificate, "certificate"))) throw new Error("Envie um certificado PDF, JPG, PNG ou WebP válido.");
  }
}

export async function onRequestPost(context) {
  if (!context.env.CADASTROS) return error("O armazenamento ainda não está configurado.", 503);
  const session = await getSession(context.request, context.env);
  if (session?.role !== "company") return error("Acesso da empresa vendedora necessário.", 401);

  let parsed;
  try { parsed = await inputFromRequest(context.request); }
  catch { return error("Não foi possível ler a solicitação."); }
  const { input, photos, certificate } = parsed;
  const materialId = String(input.materialId || "");
  const type = String(input.type || "");
  const reason = clean(input.reason, 800);
  if (!UUID_PATTERN.test(materialId)) return error("Material inválido.");
  if (!REQUEST_TYPES.has(type)) return error("Selecione uma solicitação válida.");
  if (reason.length < 10) return error("Explique o motivo da solicitação com pelo menos 10 caracteres.");

  const materialKey = `material:${session.companyId}:${materialId}`;
  const material = await context.env.CADASTROS.get(materialKey, "json");
  if (!material) return error("Material não encontrado.", 404);
  if (material.status !== "approved") return error("Somente materiais aprovados podem ter o anúncio alterado.", 409);
  const advertisement = await context.env.CADASTROS.get(`anuncio:${materialId}`, "json");
  if (!advertisement || advertisement.companyId !== session.companyId) return error("Anúncio não encontrado.", 404);
  const requiredAdvertisementStatus = type === "reactivate" ? "suspended" : "published";
  if (advertisement.status !== requiredAdvertisementStatus) return error(type === "reactivate" ? "Somente anúncios suspensos podem ser reativados." : "Este anúncio não está publicado.", 409);
  if (material.advertisementRequest?.status === "pending") return error("Este material já possui uma solicitação aguardando análise.", 409);

  let proposal = null;
  if (type === "change") {
    const quantityCurrent = Number(input.proposal?.quantityCurrent);
    const unitPriceCents = Number(input.proposal?.unitPriceCents);
    const committed = Math.max(0, Number(material.quantityReserved) || 0) + Math.max(0, Number(material.quantitySold) || 0);
    if (!clean(input.proposal?.description, 1000)) return error("Informe a descrição do material.");
    if (!CONDITIONS.has(input.proposal?.condition)) return error("Selecione uma condição válida.");
    if (!Number.isFinite(quantityCurrent) || quantityCurrent <= 0 || quantityCurrent < committed) return error(`A quantidade não pode ser menor que ${committed}, já comprometida em reservas e vendas.`);
    if (!Number.isInteger(unitPriceCents) || unitPriceCents <= 0) return error("Informe um preço válido.");
    const certificateAction = ["keep", "remove", "replace"].includes(input.certificateAction) ? input.certificateAction : "keep";
    if (certificateAction === "replace" && !certificate) return error("Selecione o novo certificado.");
    try { await validateFiles(photos, certificate); }
    catch (caught) { return error(caught.message); }
    proposal = {
      partNumber: clean(input.proposal?.partNumber, 100),
      manufacturer: clean(input.proposal?.manufacturer, 150),
      description: clean(input.proposal?.description, 1000),
      condition: input.proposal.condition,
      quantityCurrent,
      unitPriceCents,
      replacePhotos: photos.length > 0,
      certificateAction,
    };
  }

  const now = new Date().toISOString();
  const requestId = crypto.randomUUID();
  const uploadedKeys = [];
  const proposedFiles = [];
  try {
    if ((photos.length || certificate) && !context.env.MATERIAL_FILES) return error("O armazenamento de arquivos ainda não está configurado.", 503);
    for (const [kind, file] of [...photos.map((file) => ["photo", file]), ...(certificate ? [["certificate", certificate]] : [])]) {
      const id = crypto.randomUUID();
      const storageKey = objectKey(session.companyId, requestId, id);
      await context.env.MATERIAL_FILES.put(storageKey, file, { httpMetadata: { contentType: file.type } });
      uploadedKeys.push(storageKey);
      proposedFiles.push({ id, kind, name: safeFilename(file.name), type: file.type, size: file.size, uploadedAt: now, storageMaterialId: requestId });
    }
    const request = { id: requestId, materialId, companyId: session.companyId, userId: session.userId || session.email, type, reason, proposal, proposedFiles, status: "pending", createdAt: now };
    const summary = { id: request.id, type, reason, status: request.status, createdAt: now };
    await context.env.CADASTROS.put(`solicitacao-anuncio:${request.id}`, JSON.stringify(request));
    await context.env.CADASTROS.put(materialKey, JSON.stringify({ ...material, advertisementRequest: summary, updatedAt: now }));
    return Response.json({ request: summary, message: "Solicitação enviada para análise administrativa." }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch {
    await Promise.all(uploadedKeys.map((key) => context.env.MATERIAL_FILES?.delete(key)));
    await context.env.CADASTROS.delete(`solicitacao-anuncio:${requestId}`);
    return error("Não foi possível salvar a solicitação. Tente novamente.", 500);
  }
}

export function onRequest() {
  return new Response("Método não permitido.", { status: 405, headers: { Allow: "POST" } });
}
