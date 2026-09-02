const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{12}$/i;
const DECISIONS = new Set(["in_intermediation", "rejected"]);

function error(message, status = 400) {
  return Response.json({ message }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function onRequestPatch(context) {
  if (!context.env.CADASTROS) return error("O armazenamento ainda não está configurado.", 503);
  const id = String(context.params.id || "");
  if (!UUID_PATTERN.test(id)) return error("Interesse inválido.");
  let input;
  try { input = await context.request.json(); } catch { return error("Não foi possível ler a decisão."); }
  const status = String(input.status || "");
  const rejectionReason = String(input.rejectionReason || "").trim().replace(/\s+/g, " ").slice(0, 500);
  if (!DECISIONS.has(status)) return error("Decisão inválida.");
  if (status === "rejected" && !rejectionReason) return error("Informe o motivo da rejeição.");

  const key = `interesse:${id}`;
  const interest = await context.env.CADASTROS.get(key, "json");
  if (!interest) return error("Interesse não encontrado.", 404);
  if (interest.status !== "received") return error("Este interesse já foi decidido.", 409);
  const updated = {
    ...interest,
    status,
    rejectionReason: status === "rejected" ? rejectionReason : "",
    decidedAt: new Date().toISOString(),
  };
  await context.env.CADASTROS.put(key, JSON.stringify(updated));
  return Response.json({ success: true, interest: updated }, { headers: { "Cache-Control": "no-store" } });
}

export function onRequest() {
  return new Response("Método não permitido.", { status: 405, headers: { Allow: "PATCH" } });
}
