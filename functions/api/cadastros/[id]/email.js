import { configuredCredentials, hashEmail } from "../../../_auth.js";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function error(message, status = 400) {
  return Response.json({ message }, { status, headers: { "Cache-Control": "no-store" } });
}

async function emailBelongsToAnotherCompany(env, email, companyId) {
  let cursor;
  do {
    const page = await env.CADASTROS.list({ prefix: "cadastro:", cursor });
    const keys = page.keys.filter((key) => key.name.endsWith(":dados"));
    const companies = await Promise.all(keys.map((key) => env.CADASTROS.get(key.name, "json")));
    if (companies.some((company) => company && company.id !== companyId && company.primaryEmail?.toLowerCase() === email)) return true;
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);
  return false;
}

export async function onRequestPatch(context) {
  if (!context.env.CADASTROS) return error("O armazenamento ainda não está configurado.", 503);
  const id = context.params.id;
  if (!UUID_PATTERN.test(id)) return error("Empresa inválida.");

  let input;
  try { input = await context.request.json(); } catch { return error("Não foi possível ler o novo e-mail."); }
  const newEmail = String(input.email || "").trim().toLowerCase();
  if (!EMAIL_PATTERN.test(newEmail) || newEmail.length > 254) return error("Informe um endereço de e-mail válido.");

  const key = `cadastro:${id}:dados`;
  const company = await context.env.CADASTROS.get(key, "json");
  if (!company) return error("Empresa não encontrada.", 404);
  const oldEmail = String(company.primaryEmail || "").trim().toLowerCase();
  if (newEmail === oldEmail) return error("O novo e-mail é igual ao atual.");
  if (configuredCredentials(context.env)?.email === newEmail) return error("Este e-mail pertence ao acesso administrativo.", 409);
  if (await emailBelongsToAnotherCompany(context.env, newEmail, id)) return error("Este e-mail já está cadastrado para outra empresa.", 409);

  const newEmailKey = `conta-email:${await hashEmail(newEmail)}`;
  const mappedCompanyId = await context.env.CADASTROS.get(newEmailKey);
  if (mappedCompanyId && mappedCompanyId !== id) return error("Este e-mail já está vinculado a outro acesso.", 409);

  try {
    const changedAt = new Date().toISOString();
    const account = await context.env.CADASTROS.get(`conta:${id}`, "json");
    const updatedCompany = {
      ...company,
      primaryEmail: newEmail,
      emailChangeHistory: [...(Array.isArray(company.emailChangeHistory) ? company.emailChangeHistory : []), { previousEmail: oldEmail, newEmail, changedAt }],
    };
    await context.env.CADASTROS.put(newEmailKey, id);
    await context.env.CADASTROS.put(key, JSON.stringify(updatedCompany));
    if (account) await context.env.CADASTROS.put(`conta:${id}`, JSON.stringify({ ...account, email: newEmail, updatedAt: changedAt }));
    if (oldEmail) await context.env.CADASTROS.delete(`conta-email:${await hashEmail(oldEmail)}`);
    return Response.json({ success: true, company: updatedCompany, message: "E-mail alterado com sucesso. O próximo acesso deverá usar o novo endereço." }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return error("Não foi possível alterar o e-mail. Tente novamente.", 500);
  }
}

export function onRequest() {
  return new Response("Método não permitido.", { status: 405, headers: { Allow: "PATCH" } });
}
