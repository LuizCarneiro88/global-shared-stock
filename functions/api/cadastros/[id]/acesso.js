const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const LINK_DURATION_SECONDS = 24 * 60 * 60;

function bytesToBase64Url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

async function tokenHash(token) {
  const bytes = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token)));
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function error(message, status = 400) {
  return Response.json({ message }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function onRequestPost(context) {
  if (!context.env.CADASTROS) return error("O armazenamento ainda não está configurado.", 503);
  const id = context.params.id;
  if (!UUID_PATTERN.test(id)) return error("Solicitação inválida.");
  const company = await context.env.CADASTROS.get(`cadastro:${id}:dados`, "json");
  if (!company) return error("Solicitação não encontrada.", 404);
  if (company.status !== "approved") return error("A empresa precisa estar aprovada para receber acesso.", 409);

  const previousHash = await context.env.CADASTROS.get(`ativacao-empresa:${id}`);
  if (previousHash) await context.env.CADASTROS.delete(`ativacao:${previousHash}`);

  const token = bytesToBase64Url(crypto.getRandomValues(new Uint8Array(32)));
  const hash = await tokenHash(token);
  const expiresAt = Date.now() + LINK_DURATION_SECONDS * 1000;
  await context.env.CADASTROS.put(
    `ativacao:${hash}`,
    JSON.stringify({ companyId: id, email: company.primaryEmail, expiresAt }),
    { expirationTtl: LINK_DURATION_SECONDS },
  );
  await context.env.CADASTROS.put(`ativacao-empresa:${id}`, hash, { expirationTtl: LINK_DURATION_SECONDS });
  const link = new URL("/ativar-acesso", context.request.url);
  link.searchParams.set("token", token);
  return Response.json({ link: link.toString(), expiresAt }, { headers: { "Cache-Control": "no-store" } });
}

export function onRequest() {
  return new Response("Método não permitido.", { status: 405, headers: { Allow: "POST" } });
}
