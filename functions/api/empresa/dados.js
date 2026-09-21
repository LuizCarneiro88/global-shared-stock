import { getSession } from "../../_auth.js";

function error(message, status = 400) {
  return Response.json({ message }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function onRequestGet(context) {
  if (!context.env.CADASTROS) return error("O armazenamento ainda não está configurado.", 503);
  const session = await getSession(context.request, context.env);
  if (session?.role !== "company") return error("Acesso da empresa necessário.", 401);

  const company = await context.env.CADASTROS.get(`cadastro:${session.companyId}:dados`, "json");
  if (!company) return error("Empresa não encontrada.", 404);

  return Response.json({
    company: {
      id: company.id,
      companyName: company.companyName,
      cnpj: company.cnpj,
      stateRegistration: company.stateRegistration || "",
      cityRegistration: company.cityRegistration || "",
      commercialProfile: company.interest,
      inventorySize: company.inventorySize,
      status: company.status,
      primaryUser: {
        name: company.primaryUserName || company.primaryContact,
        email: company.primaryUserEmail || company.primaryEmail,
        role: "primary",
      },
      commercialContacts: company.commercialContacts || [{
        id: "legacy-primary-contact",
        name: company.primaryContact,
        role: "Não informado",
        email: company.primaryEmail,
        phone: "",
        whatsapp: "",
        preferredContact: "email",
        primary: true,
        status: "active",
      }],
      stockLocations: company.stockLocations || [],
    },
  }, { headers: { "Cache-Control": "no-store" } });
}

export function onRequest() {
  return new Response("Método não permitido.", { status: 405, headers: { Allow: "GET" } });
}
