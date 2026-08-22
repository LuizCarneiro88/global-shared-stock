import { getSession } from "../../_auth.js";
import { MATERIAL_ID_PATTERN, MAX_CERTIFICATE_SIZE, MAX_PHOTOS, MAX_PHOTO_SIZE, manifestKey, objectKey, safeFilename, validFileType } from "../../_material-files.js";

function error(message, status = 400) {
  return Response.json({ message }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function onRequestPost(context) {
  if (!context.env.CADASTROS || !context.env.MATERIAL_FILES) return error("O armazenamento de arquivos ainda não está configurado.", 503);
  const session = await getSession(context.request, context.env);
  if (!session || session.role !== "company") return error("Acesso não autorizado.", 401);
  let formData;
  try { formData = await context.request.formData(); } catch { return error("Não foi possível ler o arquivo."); }
  const materialId = String(formData.get("materialId") || "");
  const kind = String(formData.get("kind") || "");
  const file = formData.get("file");
  if (!MATERIAL_ID_PATTERN.test(materialId)) return error("Identificação do material inválida.");
  if (await context.env.CADASTROS.get(`material:${session.companyId}:${materialId}`)) return error("Os arquivos não podem ser alterados depois do envio para análise.", 409);
  if (!['photo', 'certificate'].includes(kind) || !(file instanceof File) || file.size <= 0) return error("Arquivo inválido.");
  const maximumSize = kind === "photo" ? MAX_PHOTO_SIZE : MAX_CERTIFICATE_SIZE;
  if (file.size > maximumSize) return error(kind === "photo" ? "Cada fotografia pode ter no máximo 8 MB." : "O certificado pode ter no máximo 10 MB.");
  if (!(await validFileType(file, kind))) return error(kind === "photo" ? "Envie uma fotografia JPG, PNG ou WebP válida." : "Envie um certificado em PDF válido.");

  const key = manifestKey(session.companyId, materialId);
  const manifest = await context.env.CADASTROS.get(key, "json") || [];
  if (kind === "photo" && manifest.filter((item) => item.kind === "photo").length >= MAX_PHOTOS) return error("Envie no máximo 6 fotografias.");
  if (kind === "certificate" && manifest.some((item) => item.kind === "certificate")) return error("Remova o certificado atual antes de enviar outro.");

  const id = crypto.randomUUID();
  const metadata = { id, kind, name: safeFilename(file.name), type: file.type, size: file.size, uploadedAt: new Date().toISOString() };
  try {
    await context.env.MATERIAL_FILES.put(objectKey(session.companyId, materialId, id), file, { httpMetadata: { contentType: file.type } });
    manifest.push(metadata);
    await context.env.CADASTROS.put(key, JSON.stringify(manifest));
    return Response.json({ file: { ...metadata, url: `/api/empresa/arquivos/${materialId}/${id}` } }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch {
    return error("Não foi possível salvar o arquivo. Tente novamente.", 500);
  }
}

export function onRequest() {
  return new Response("Método não permitido.", { status: 405, headers: { Allow: "POST" } });
}
