export const MATERIAL_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const FILE_ID_PATTERN = MATERIAL_ID_PATTERN;
export const MAX_PHOTOS = 6;
export const MAX_PHOTO_SIZE = 8 * 1024 * 1024;
export const MAX_CERTIFICATE_SIZE = 10 * 1024 * 1024;

export function manifestKey(companyId, materialId) {
  return `material-arquivos:${companyId}:${materialId}`;
}

export function objectKey(companyId, materialId, fileId) {
  return `${companyId}/${materialId}/${fileId}`;
}

export function safeFilename(value) {
  return String(value || "arquivo").replace(/[\r\n"\\/]/g, "_").slice(0, 180) || "arquivo";
}

export async function validFileType(file, kind) {
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const validPdf = file.type === "application/pdf" && new TextDecoder().decode(bytes.slice(0, 5)) === "%PDF-";
  const validJpeg = file.type === "image/jpeg" && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const validPng = file.type === "image/png" && [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((value, index) => bytes[index] === value);
  let validWebp = false;
  if (file.type === "image/webp") {
    validWebp = new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF" && new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP";
  }
  const validImage = validJpeg || validPng || validWebp;
  return kind === "certificate" ? validPdf || validImage : validImage;
}

export function fileResponse(object, metadata) {
  if (!object) return new Response("Arquivo não encontrado.", { status: 404 });
  return new Response(object.body, {
    headers: {
      "Content-Type": metadata.type,
      "Content-Disposition": `inline; filename="${safeFilename(metadata.name)}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
