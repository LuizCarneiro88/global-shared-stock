function error(message, status = 400) {
  return Response.json({ message }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function onRequestGet(context) {
  if (!context.env.CADASTROS) return error("O armazenamento ainda não está configurado.", 503);
  try {
    const advertisements = [];
    let cursor;
    do {
      const page = await context.env.CADASTROS.list({ prefix: "anuncio:", cursor });
      const records = await Promise.all(page.keys.map((key) => context.env.CADASTROS.get(key.name, "json")));
      advertisements.push(...records.filter((advertisement) => advertisement?.status === "published"));
      cursor = page.list_complete ? undefined : page.cursor;
    } while (cursor);
    advertisements.sort((first, second) => second.publishedAt.localeCompare(first.publishedAt));
    const publicAdvertisements = advertisements.map(({ companyId, files, ...advertisement }) => ({
      ...advertisement,
      photos: (files || []).map((file) => ({ id: file.id, url: `/api/anuncios/${advertisement.id}/fotos/${file.id}` })),
    }));
    return Response.json({ advertisements: publicAdvertisements }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return error("Não foi possível carregar os anúncios.", 500);
  }
}

export function onRequest() {
  return new Response("Método não permitido.", { status: 405, headers: { Allow: "GET" } });
}
