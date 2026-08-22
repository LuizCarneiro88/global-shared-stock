import { FILE_ID_PATTERN, MATERIAL_ID_PATTERN, fileResponse, manifestKey, objectKey } from "../../../../../_material-files.js";

export async function onRequestGet(context) {
  if (!context.env.CADASTROS || !context.env.MATERIAL_FILES) return new Response("Armazenamento não configurado.", { status: 503 });
  const { companyId, materialId, fileId } = context.params;
  if (!MATERIAL_ID_PATTERN.test(companyId) || !MATERIAL_ID_PATTERN.test(materialId) || !FILE_ID_PATTERN.test(fileId)) return new Response("Arquivo inválido.", { status: 400 });
  const material = await context.env.CADASTROS.get(`material:${companyId}:${materialId}`, "json");
  if (!material) return new Response("Material não encontrado.", { status: 404 });
  const manifest = await context.env.CADASTROS.get(manifestKey(companyId, materialId), "json") || [];
  const metadata = manifest.find((item) => item.id === fileId);
  if (!metadata) return new Response("Arquivo não encontrado.", { status: 404 });
  const object = await context.env.MATERIAL_FILES.get(objectKey(companyId, materialId, fileId));
  return fileResponse(object, metadata);
}

export function onRequest() {
  return new Response("Método não permitido.", { status: 405, headers: { Allow: "GET" } });
}
