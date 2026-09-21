import { getSession } from "../../../../_auth.js";
import { FILE_ID_PATTERN, MATERIAL_ID_PATTERN, fileResponse, objectKey } from "../../../../_material-files.js";

export async function onRequestGet(context) {
  if (!context.env.CADASTROS || !context.env.MATERIAL_FILES) return new Response("Armazenamento não configurado.", { status: 503 });
  const session = await getSession(context.request, context.env);
  if (session?.role !== "admin") return new Response("Acesso administrativo necessário.", { status: 403 });
  const id = String(context.params.id || "");
  const fileId = String(context.params.fileId || "");
  if (!MATERIAL_ID_PATTERN.test(id) || !FILE_ID_PATTERN.test(fileId)) return new Response("Arquivo inválido.", { status: 400 });
  const request = await context.env.CADASTROS.get(`solicitacao-anuncio:${id}`, "json");
  const metadata = (request?.proposedFiles || []).find((file) => file.id === fileId);
  if (!request || !metadata) return new Response("Arquivo não encontrado.", { status: 404 });
  const object = await context.env.MATERIAL_FILES.get(objectKey(request.companyId, metadata.storageMaterialId || id, fileId));
  return fileResponse(object, metadata);
}

export function onRequest() {
  return new Response("Método não permitido.", { status: 405, headers: { Allow: "GET" } });
}
