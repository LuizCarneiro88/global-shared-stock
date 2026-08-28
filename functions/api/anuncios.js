import { getSession } from "../_auth.js";

function error(message, status = 400) {
  return Response.json({ message }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function onRequestGet(context) {
  if (!context.env.CADASTROS) return error("O armazenamento ainda não está configurado.", 503);
  try {
    const session = await getSession(context.request, context.env);
    const viewerCompany = session?.role === "company"
      ? await context.env.CADASTROS.get(`cadastro:${session.companyId}:dados`, "json")
      : null;
    const advertisements = [];
    let cursor;
    do {
      const page = await context.env.CADASTROS.list({ prefix: "anuncio:", cursor });
      const records = await Promise.all(page.keys.map((key) => context.env.CADASTROS.get(key.name, "json")));
      advertisements.push(...records.filter((advertisement) => advertisement?.status === "published"));
      cursor = page.list_complete ? undefined : page.cursor;
    } while (cursor);
    advertisements.sort((first, second) => second.publishedAt.localeCompare(first.publishedAt));
    const publicAdvertisements = advertisements.map(({ companyId, files, unitPriceCents, hasCertificate, ...advertisement }) => {
      let eligibility = { allowed: false, code: "not_registered", message: "Cadastre sua empresa ou entre em uma conta aprovada para consultar o preço e registrar interesse." };
      if (viewerCompany?.status === "approved") {
        if (viewerCompany.id === companyId) eligibility = { allowed: false, code: "own_advertisement", message: "Sua empresa não pode registrar interesse no próprio anúncio." };
        else if (viewerCompany.interest === "sell") eligibility = { allowed: false, code: "seller_only", message: "Sua empresa está cadastrada exclusivamente como vendedora e não pode registrar interesses de compra." };
        else if (["buy", "both"].includes(viewerCompany.interest)) eligibility = { allowed: true, code: "allowed", message: "Sua empresa está autorizada a registrar interesse neste material." };
      } else if (session?.role === "admin") eligibility = { allowed: false, code: "administrative_account", message: "A conta administrativa não pode registrar interesses de compra." };
      else if (session) eligibility = { allowed: false, code: "company_not_approved", message: "A empresa precisa estar aprovada para consultar o preço e registrar interesse." };
      return {
        ...advertisement,
        photos: (files || []).map((file) => ({ id: file.id, url: `/api/anuncios/${advertisement.id}/fotos/${file.id}` })),
        eligibility,
        ...(eligibility.allowed ? { unitPriceCents, hasCertificate } : {}),
      };
    });
    const viewer = session?.role === "admin"
      ? { role: "admin", label: "Administrador" }
      : viewerCompany
        ? { role: "company", label: viewerCompany.companyName }
        : null;
    return Response.json({ advertisements: publicAdvertisements, authenticated: Boolean(viewer), viewer }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return error("Não foi possível carregar os anúncios.", 500);
  }
}

export function onRequest() {
  return new Response("Método não permitido.", { status: 405, headers: { Allow: "GET" } });
}
