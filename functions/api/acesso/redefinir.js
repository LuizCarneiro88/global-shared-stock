import { hashPassword } from "../../_auth.js";

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{40,60}$/;

async function tokenHash(token) {
  const bytes = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token)));
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function error(message, status = 400) {
  return Response.json({ message }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function onRequestPost(context) {
  if (!context.env.CADASTROS) return error("O armazenamento ainda não está configurado.", 503);
  let input;
  try { input = await context.request.json(); } catch { return error("Não foi possível ler os dados."); }
  if (!TOKEN_PATTERN.test(input.token || "")) return error("Link de redefinição inválido.");
  if (typeof input.password !== "string" || input.password.length < 12 || input.password.length > 128) {
    return error("A senha deve ter entre 12 e 128 caracteres.");
  }

  const hash = await tokenHash(input.token);
  const reset = await context.env.CADASTROS.get(`redefinicao:${hash}`, "json");
  if (!reset || reset.expiresAt <= Date.now()) return error("Este link expirou ou já foi utilizado.", 410);
  const account = await context.env.CADASTROS.get(`conta:${reset.companyId}`, "json");
  if (!account?.active) return error("A conta da empresa não está ativa.", 403);

  const password = await hashPassword(input.password);
  await context.env.CADASTROS.put(`conta:${reset.companyId}`, JSON.stringify({
    ...account,
    passwordHash: password.hash,
    salt: password.salt,
    iterations: password.iterations,
    passwordChangedAt: new Date().toISOString(),
  }));
  await context.env.CADASTROS.delete(`redefinicao:${hash}`);
  await context.env.CADASTROS.delete(`redefinicao-empresa:${reset.companyId}`);
  return Response.json({ success: true }, { headers: { "Cache-Control": "no-store" } });
}

export function onRequest() {
  return new Response("Método não permitido.", { status: 405, headers: { Allow: "POST" } });
}
