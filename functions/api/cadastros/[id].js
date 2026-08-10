const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ALLOWED_STATUSES = new Set(["approved", "rejected"]);

function error(message, status = 400) {
  return Response.json({ message }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function onRequestPatch(context) {
  if (!context.env.CADASTROS) return error("O armazenamento ainda não está configurado.", 503);
  const id = context.params.id;
  if (!UUID_PATTERN.test(id)) return error("Solicitação inválida.");

  let input;
  try {
    input = await context.request.json();
  } catch {
    return error("Não foi possível ler a decisão.");
  }
  if (!ALLOWED_STATUSES.has(input.status)) return error("Decisão inválida.");

  const key = `cadastro:${id}:dados`;
  const company = await context.env.CADASTROS.get(key, "json");
  if (!company) return error("Solicitação não encontrada.", 404);

  company.status = input.status;
  company.decidedAt = new Date().toISOString();
  await context.env.CADASTROS.put(key, JSON.stringify(company));
  return Response.json({ success: true, company }, { headers: { "Cache-Control": "no-store" } });
}

export function onRequest() {
  return new Response("Método não permitido.", { status: 405, headers: { Allow: "PATCH" } });
}
