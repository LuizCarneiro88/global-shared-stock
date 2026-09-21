import { getSession } from "../_auth.js";

function error(message, status = 400) {
  return Response.json({ message }, { status, headers: { "Cache-Control": "no-store" } });
}

async function listByPrefix(storage, prefix) {
  const result = [];
  let cursor;
  do {
    const page = await storage.list({ prefix, cursor });
    const records = await Promise.all(page.keys.map((key) => storage.get(key.name, "json")));
    result.push(...records.filter(Boolean));
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);
  return result;
}

export async function onRequestGet(context) {
  if (!context.env.CADASTROS) return error("O armazenamento ainda não está configurado.", 503);
  const session = await getSession(context.request, context.env);
  if (session?.role !== "admin") return error("Acesso administrativo necessário.", 403);
  try {
    const requests = await listByPrefix(context.env.CADASTROS, "solicitacao-anuncio:");
    const companyIds = [...new Set(requests.map((item) => item.companyId))];
    const materialKeys = [...new Set(requests.map((item) => `material:${item.companyId}:${item.materialId}`))];
    const [companies, materials] = await Promise.all([
      Promise.all(companyIds.map((id) => context.env.CADASTROS.get(`cadastro:${id}:dados`, "json"))),
      Promise.all(materialKeys.map((key) => context.env.CADASTROS.get(key, "json"))),
    ]);
    const companiesById = new Map(companies.filter(Boolean).map((item) => [item.id, item]));
    const materialsByKey = new Map(materials.filter(Boolean).map((item) => [`material:${item.companyId}:${item.id}`, item]));
    const result = requests.map((request) => ({
      ...request,
      companyName: companiesById.get(request.companyId)?.companyName || "Empresa não encontrada",
      material: materialsByKey.get(`material:${request.companyId}:${request.materialId}`) || null,
    })).sort((first, second) => second.createdAt.localeCompare(first.createdAt));
    return Response.json({ requests: result }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return error("Não foi possível carregar as solicitações de anúncios.", 500);
  }
}

export function onRequest() {
  return new Response("Método não permitido.", { status: 405, headers: { Allow: "GET" } });
}
