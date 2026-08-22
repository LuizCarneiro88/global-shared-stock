const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DECISIONS = new Set(["approved", "rejected"]);

function error(message, status = 400) {
  return Response.json({ message }, { status, headers: { "Cache-Control": "no-store" } });
}

function publicAdvertisement(material, publishedAt) {
  return {
    id: material.id,
    companyId: material.companyId,
    description: material.description,
    partNumber: material.partNumber,
    manufacturer: material.manufacturer,
    category: material.category,
    otherCategory: material.otherCategory,
    subcategory: material.subcategory,
    otherSubcategory: material.otherSubcategory,
    materialType: material.materialType,
    otherMaterialType: material.otherMaterialType,
    condition: material.condition,
    quantity: material.quantity,
    unit: material.unit,
    otherUnit: material.otherUnit,
    hasCertificate: material.hasCertificate,
    files: (material.files || []).filter((file) => file.kind === "photo"),
    coverPhotoId: material.coverPhotoId,
    unitPriceCents: material.unitPriceCents,
    status: "published",
    publishedAt,
  };
}

export async function onRequestPatch(context) {
  if (!context.env.CADASTROS) return error("O armazenamento ainda não está configurado.", 503);
  const { companyId, materialId } = context.params;
  if (!UUID_PATTERN.test(companyId) || !UUID_PATTERN.test(materialId)) return error("Material inválido.");
  let input;
  try { input = await context.request.json(); } catch { return error("Não foi possível ler a decisão."); }
  if (!DECISIONS.has(input.status)) return error("Decisão inválida.");
  const rejectionReason = typeof input.rejectionReason === "string" ? input.rejectionReason.trim().slice(0, 500) : "";
  if (input.status === "rejected" && !rejectionReason) return error("Informe o motivo da rejeição.");

  const key = `material:${companyId}:${materialId}`;
  const material = await context.env.CADASTROS.get(key, "json");
  if (!material) return error("Material não encontrado.", 404);
  if (material.status !== "pending") return error("Este material já foi avaliado.", 409);
  const decidedAt = new Date().toISOString();
  const updated = { ...material, status: input.status, rejectionReason: input.status === "rejected" ? rejectionReason : "", decidedAt };

  try {
    if (input.status === "approved") {
      await context.env.CADASTROS.put(`anuncio:${materialId}`, JSON.stringify(publicAdvertisement(updated, decidedAt)));
      try {
        await context.env.CADASTROS.put(key, JSON.stringify(updated));
      } catch (saveError) {
        await context.env.CADASTROS.delete(`anuncio:${materialId}`);
        throw saveError;
      }
    } else {
      await context.env.CADASTROS.delete(`anuncio:${materialId}`);
      await context.env.CADASTROS.put(key, JSON.stringify(updated));
    }
    return Response.json({ material: updated }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return error("Não foi possível salvar a decisão. Tente novamente.", 500);
  }
}

export function onRequest() {
  return new Response("Método não permitido.", { status: 405, headers: { Allow: "PATCH" } });
}
