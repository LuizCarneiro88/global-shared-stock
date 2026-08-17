function error(message, status = 400) {
  return Response.json({ message }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function onRequestGet(context) {
  if (!context.env.CADASTROS) return error("O armazenamento ainda não está configurado.", 503);
  try {
    const materials = [];
    let cursor;
    do {
      const page = await context.env.CADASTROS.list({ prefix: "material:", cursor });
      const records = await Promise.all(page.keys.map((key) => context.env.CADASTROS.get(key.name, "json")));
      materials.push(...records.filter(Boolean));
      cursor = page.list_complete ? undefined : page.cursor;
    } while (cursor);

    const companyIds = [...new Set(materials.map((material) => material.companyId).filter(Boolean))];
    const companies = await Promise.all(companyIds.map((id) => context.env.CADASTROS.get(`cadastro:${id}:dados`, "json")));
    const companiesById = new Map(companies.filter(Boolean).map((company) => [company.id, company]));
    const result = materials.map((material) => {
      const company = companiesById.get(material.companyId);
      return { ...material, companyName: company?.companyName || "Empresa não encontrada", companyEmail: company?.primaryEmail || "" };
    });
    result.sort((first, second) => second.submittedAt.localeCompare(first.submittedAt));
    return Response.json({ materials: result }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return error("Não foi possível carregar os materiais.", 500);
  }
}

export function onRequest() {
  return new Response("Método não permitido.", { status: 405, headers: { Allow: "GET" } });
}
