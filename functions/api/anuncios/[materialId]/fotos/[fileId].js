import { FILE_ID_PATTERN, MATERIAL_ID_PATTERN, fileResponse, objectKey } from "../../../../_material-files.js";

export async function onRequestGet(context) {
  if (!context.env.CADASTROS || !context.env.MATERIAL_FILES) return new Response("Armazenamento não configurado.", { status: 503 });
  const { materialId, fileId } = context.params;
  if (!MATERIAL_ID_PATTERN.test(materialId) || !FILE_ID_PATTERN.test(fileId)) return new Response("Fotografia inválida.", { status: 400 });
  const advertisement = await context.env.CADASTROS.get(`anuncio:${materialId}`, "json");
  if (!advertisement || advertisement.status !== "published") return new Response("Anúncio não encontrado.", { status: 404 });
  const metadata = (advertisement.files || []).find((file) => file.id === fileId && file.kind === "photo");
  if (!metadata) return new Response("Fotografia não encontrada.", { status: 404 });
  const object = await context.env.MATERIAL_FILES.get(objectKey(advertisement.companyId, materialId, fileId));
  return fileResponse(object, metadata);
}

export function onRequest() {
  return new Response("Método não permitido.", { status: 405, headers: { Allow: "GET" } });
}
