import { getSession } from "../_auth.js";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DEADLINES = new Set(["immediate", "7_days", "15_days", "30_days", "flexible"]);
const SUBJECTS = new Set(["availability", "technical", "commercial", "documentation", "other"]);

function error(message, status = 400) {
  return Response.json({ message }, { status, headers: { "Cache-Control": "no-store" } });
}

function cleanText(value, maximum) {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, maximum);
}

async function listInterests(env) {
  const interests = [];
  let cursor;
  do {
    const page = await env.CADASTROS.list({ prefix: "interesse:", cursor });
    const records = await Promise.all(page.keys.map((key) => env.CADASTROS.get(key.name, "json")));
    interests.push(...records.filter(Boolean));
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);
  return interests;
}

export async function onRequestGet(context) {
  if (!context.env.CADASTROS) return error("O armazenamento ainda não está configurado.", 503);
  const session = await getSession(context.request, context.env);
  if (!session || !["admin", "company"].includes(session.role)) return error("Acesso necessário.", 403);

  try {
    const interests = await listInterests(context.env);
    if (session.role === "company") {
      const ownInterests = interests
        .filter((item) => item.buyerCompanyId === session.companyId)
        .map(({ sellerCompanyId, buyerCompanyId, ...item }) => item)
        .sort((first, second) => second.createdAt.localeCompare(first.createdAt));
      return Response.json({ interests: ownInterests }, { headers: { "Cache-Control": "private, no-store" } });
    }
    const companyIds = [...new Set(interests.flatMap((item) => [item.buyerCompanyId, item.sellerCompanyId]))];
    const companies = await Promise.all(companyIds.map((id) => context.env.CADASTROS.get(`cadastro:${id}:dados`, "json")));
    const companiesById = new Map(companies.filter(Boolean).map((company) => [company.id, company]));
    const result = interests.map((item) => {
      const buyer = companiesById.get(item.buyerCompanyId);
      const seller = companiesById.get(item.sellerCompanyId);
      return {
        ...item,
        buyer: { companyName: buyer?.companyName || "Empresa não encontrada", primaryEmail: buyer?.primaryEmail || "" },
        seller: { companyName: seller?.companyName || "Empresa não encontrada", primaryEmail: seller?.primaryEmail || "" },
      };
    });
    result.sort((first, second) => second.createdAt.localeCompare(first.createdAt));
    return Response.json({ interests: result }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return error("Não foi possível carregar os interesses.", 500);
  }
}

export async function onRequestPost(context) {
  if (!context.env.CADASTROS) return error("O armazenamento ainda não está configurado.", 503);
  const session = await getSession(context.request, context.env);
  if (session?.role !== "company") return error("Entre com uma empresa aprovada para registrar interesse.", 401);

  try {
    const input = await context.request.json();
    const materialId = cleanText(input.materialId, 36);
    const quantity = Number(input.quantity);
    const deadline = cleanText(input.deadline, 20);
    const subject = cleanText(input.subject, 30);
    const note = cleanText(input.note, 800);
    if (!UUID_PATTERN.test(materialId)) return error("Material inválido.");
    if (!Number.isFinite(quantity) || quantity <= 0) return error("Informe uma quantidade maior que zero.");
    if (!DEADLINES.has(deadline)) return error("Selecione um prazo válido.");
    if (!SUBJECTS.has(subject)) return error("Selecione o assunto do interesse.");

    const [buyer, advertisement] = await Promise.all([
      context.env.CADASTROS.get(`cadastro:${session.companyId}:dados`, "json"),
      context.env.CADASTROS.get(`anuncio:${materialId}`, "json"),
    ]);
    if (!buyer || buyer.status !== "approved") return error("A empresa precisa estar aprovada para registrar interesse.", 403);
    if (buyer.interest === "sell") return error("Sua empresa está cadastrada exclusivamente como vendedora e não pode registrar interesses de compra.", 403);
    if (!advertisement || advertisement.status !== "published") return error("Este anúncio não está mais disponível.", 404);
    if (advertisement.companyId === session.companyId) return error("Sua empresa não pode registrar interesse no próprio anúncio.", 403);
    if (quantity > Number(advertisement.quantity)) return error("A quantidade solicitada é maior que a disponibilidade anunciada.");

    const id = crypto.randomUUID();
    const interest = {
      id,
      materialId,
      buyerCompanyId: session.companyId,
      sellerCompanyId: advertisement.companyId,
      materialDescription: advertisement.description,
      partNumber: advertisement.partNumber || "",
      quantity,
      unit: advertisement.unit,
      otherUnit: advertisement.otherUnit || "",
      deadline,
      subject,
      note,
      status: "received",
      createdAt: new Date().toISOString(),
    };
    await context.env.CADASTROS.put(`interesse:${id}`, JSON.stringify(interest));
    return Response.json({ success: true, interestId: id, message: "Interesse registrado com segurança. A Global Shared Stock conduzirá a intermediação." }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (caught) {
    if (caught instanceof SyntaxError) return error("Dados do interesse inválidos.");
    return error("Não foi possível registrar o interesse.", 500);
  }
}

export function onRequest() {
  return new Response("Método não permitido.", { status: 405, headers: { Allow: "GET, POST" } });
}
