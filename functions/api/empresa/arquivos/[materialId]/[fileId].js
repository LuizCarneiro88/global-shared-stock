import { getSession } from "../../../../_auth.js";
import { FILE_ID_PATTERN, MATERIAL_ID_PATTERN, fileResponse, manifestKey, objectKey } from "../../../../_material-files.js";

async function information(context) {
  const session = await getSession(context.request, context.env);
  if (!session || session.role !== "company") return { error: new Response("Acesso não autorizado.", { status: 401 }) };
  const { materialId, fileId } = context.params;
  if (!MATERIAL_ID_PATTERN.test(materialId) || !FILE_ID_PATTERN.test(fileId)) return { error: new Response("Arquivo inválido.", { status: 400 }) };
  const key = manifestKey(session.companyId, materialId);
  const manifest = await context.env.CADASTROS.get(key, "json") || [];
  const metadata = manifest.find((item) => item.id === fileId);
  if (!metadata) return { error: new Response("Arquivo não encontrado.", { status: 404 }) };
  return { session, materialId, fileId, key, manifest, metadata };
}

export async function onRequestGet(context) {
  if (!context.env.CADASTROS || !context.env.MATERIAL_FILES) return new Response("Armazenamento não configurado.", { status: 503 });
  const result = await information(context);
  if (result.error) return result.error;
  const object = await context.env.MATERIAL_FILES.get(objectKey(result.session.companyId, result.materialId, result.fileId));
  return fileResponse(object, result.metadata);
}

export async function onRequestDelete(context) {
  if (!context.env.CADASTROS || !context.env.MATERIAL_FILES) return new Response("Armazenamento não configurado.", { status: 503 });
  const result = await information(context);
  if (result.error) return result.error;
  if (await context.env.CADASTROS.get(`material:${result.session.companyId}:${result.materialId}`)) {
    return new Response("Os arquivos não podem ser alterados depois do envio para análise.", { status: 409 });
  }
  await context.env.MATERIAL_FILES.delete(objectKey(result.session.companyId, result.materialId, result.fileId));
  await context.env.CADASTROS.put(result.key, JSON.stringify(result.manifest.filter((item) => item.id !== result.fileId)));
  return new Response(null, { status: 204 });
}

export function onRequest() {
  return new Response("Método não permitido.", { status: 405, headers: { Allow: "GET, DELETE" } });
}
