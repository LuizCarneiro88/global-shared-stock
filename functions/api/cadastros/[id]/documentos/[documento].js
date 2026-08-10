const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DOCUMENT_PATTERN = /^\d+$/;

function safeFileName(value) {
  return value.replace(/["\\\r\n]/g, "_");
}

export async function onRequestGet(context) {
  if (!context.env.CADASTROS) return new Response("Armazenamento não configurado.", { status: 503 });
  const id = context.params.id;
  const documentId = context.params.documento;
  if (!UUID_PATTERN.test(id) || !DOCUMENT_PATTERN.test(documentId)) {
    return new Response("Documento inválido.", { status: 400 });
  }

  const company = await context.env.CADASTROS.get(`cadastro:${id}:dados`, "json");
  const documentInformation = company?.documents?.find((document) => document.id === documentId);
  if (!documentInformation) return new Response("Documento não encontrado.", { status: 404 });

  const document = await context.env.CADASTROS.get(`cadastro:${id}:documento:${documentId}`, "arrayBuffer");
  if (!document) return new Response("Documento não encontrado.", { status: 404 });

  return new Response(document, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${safeFileName(documentInformation.name)}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export function onRequest() {
  return new Response("Método não permitido.", { status: 405, headers: { Allow: "GET" } });
}
