import { getSession } from "../../_auth.js";

function error(message, status = 400) {
  return Response.json({ message }, { status, headers: { "Cache-Control": "no-store" } });
}

function clean(value, maximumLength) {
  return typeof value === "string" ? value.trim().slice(0, maximumLength) : "";
}

export async function onRequestPost(context) {
  if (!context.env.CADASTROS) return error("O armazenamento ainda não está configurado.", 503);
  const session = await getSession(context.request, context.env);
  if (session?.role !== "company") return error("Acesso da empresa necessário.", 401);

  const companyKey = `cadastro:${session.companyId}:dados`;
  const company = await context.env.CADASTROS.get(companyKey, "json");
  if (!company || company.status !== "approved") return error("A empresa precisa estar aprovada.", 403);
  if (company.interest !== "sell" && company.interest !== "both") return error("Somente empresas vendedoras podem cadastrar locais de estoque.", 403);

  let input;
  try { input = await context.request.json(); } catch { return error("Não foi possível ler os dados do local de estoque."); }

  const location = {
    id: crypto.randomUUID(),
    name: clean(input.name, 120),
    country: clean(input.country, 100),
    state: clean(input.state, 100),
    protectedAddress: {
      city: clean(input.city, 120),
      postalCode: clean(input.postalCode, 20),
      neighborhood: clean(input.neighborhood, 120),
      street: clean(input.street, 180),
      number: clean(input.number, 30),
      complement: clean(input.complement, 120),
      pickupReference: clean(input.pickupReference, 500),
      accessRestrictions: clean(input.accessRestrictions, 500),
      loadingResources: clean(input.loadingResources, 500),
    },
    defaultForNewMaterials: input.defaultForNewMaterials === true,
    status: "active",
    createdAt: new Date().toISOString(),
    createdByUserId: session.userId || null,
  };

  const required = [location.name, location.country, location.state, location.protectedAddress.city, location.protectedAddress.postalCode, location.protectedAddress.neighborhood, location.protectedAddress.street, location.protectedAddress.number];
  if (required.some((value) => !value)) return error("Preencha os campos obrigatórios do local de estoque.");

  const stockLocations = Array.isArray(company.stockLocations) ? company.stockLocations : [];
  if (!stockLocations.length) location.defaultForNewMaterials = true;
  if (location.defaultForNewMaterials) stockLocations.forEach((item) => { item.defaultForNewMaterials = false; });
  stockLocations.push(location);
  company.stockLocations = stockLocations;
  await context.env.CADASTROS.put(companyKey, JSON.stringify(company));

  return Response.json({ location }, { status: 201, headers: { "Cache-Control": "no-store" } });
}

export function onRequest() {
  return new Response("Método não permitido.", { status: 405, headers: { Allow: "POST" } });
}
