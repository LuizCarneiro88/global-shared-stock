import { getSession } from "../../_auth.js";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CONDITIONS = new Set(["new", "used", "refurbished", "scrap"]);
const UNITS = new Set(["unit", "lot", "kg", "meter", "liter", "other"]);

function error(message, status = 400) {
  return Response.json({ message }, { status, headers: { "Cache-Control": "no-store" } });
}

function cleanText(value, maximumLength) {
  return typeof value === "string" ? value.trim().slice(0, maximumLength) : "";
}

function normalizedMaterial(input) {
  const quantity = Number(input.quantity);
  const unitPriceCents = Number(input.unitPriceCents);
  if (!UUID_PATTERN.test(input.id || "")) throw new Error("Identificação de material inválida.");
  if (!cleanText(input.description, 1000) || !cleanText(input.category, 100)) {
    throw new Error("Preencha todos os campos obrigatórios do material.");
  }
  if (!CONDITIONS.has(input.condition) || !UNITS.has(input.unit)) throw new Error("Condição ou unidade de medida inválida.");
  if (input.unit === "other" && !cleanText(input.otherUnit, 30)) throw new Error("Informe a outra unidade de medida.");
  if (!Number.isFinite(quantity) || quantity <= 0 || Math.abs(Math.round(quantity * 1000) - quantity * 1000) > 0.000001) {
    throw new Error("Informe uma quantidade maior que zero, com até três casas decimais.");
  }
  if (!Number.isInteger(unitPriceCents) || unitPriceCents <= 0) throw new Error("Informe um preço maior que zero.");

  const unitCommissionCents = Math.round(unitPriceCents / 10);
  const unitNetCents = unitPriceCents - unitCommissionCents;
  const totalPriceCents = Math.round(unitPriceCents * quantity);
  const totalCommissionCents = Math.round(totalPriceCents / 10);
  const totalNetCents = totalPriceCents - totalCommissionCents;
  return {
    id: input.id,
    partNumber: cleanText(input.partNumber ?? input.code, 100),
    manufacturer: cleanText(input.manufacturer, 150),
    description: cleanText(input.description, 1000),
    category: cleanText(input.category, 100),
    condition: input.condition,
    quantity,
    unit: input.unit,
    otherUnit: input.unit === "other" ? cleanText(input.otherUnit, 30) : "",
    hasCertificate: input.hasCertificate === true,
    unitPriceCents,
    unitCommissionCents,
    unitNetCents,
    totalPriceCents,
    totalCommissionCents,
    totalNetCents,
    status: "pending",
    submittedAt: new Date().toISOString(),
  };
}

export async function onRequestGet(context) {
  if (!context.env.CADASTROS) return error("O armazenamento ainda não está configurado.", 503);
  const session = await getSession(context.request, context.env);
  if (!session || session.role !== "company") return error("Acesso não autorizado.", 401);
  const company = await context.env.CADASTROS.get(`cadastro:${session.companyId}:dados`, "json");
  if (!company) return error("Empresa não encontrada.", 404);

  const materials = [];
  let cursor;
  do {
    const page = await context.env.CADASTROS.list({ prefix: `material:${session.companyId}:`, cursor });
    const records = await Promise.all(page.keys.map((key) => context.env.CADASTROS.get(key.name, "json")));
    materials.push(...records.filter(Boolean));
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);
  materials.sort((first, second) => second.submittedAt.localeCompare(first.submittedAt));
  return Response.json({ companyName: company.companyName, materials }, { headers: { "Cache-Control": "no-store" } });
}

export async function onRequestPost(context) {
  if (!context.env.CADASTROS) return error("O armazenamento ainda não está configurado.", 503);
  const session = await getSession(context.request, context.env);
  if (!session || session.role !== "company") return error("Acesso não autorizado.", 401);
  let input;
  try { input = await context.request.json(); } catch { return error("Não foi possível ler os materiais."); }
  if (!UUID_PATTERN.test(input.requestId || "")) return error("Identificação do envio inválida. Atualize a página e tente novamente.");
  if (!Array.isArray(input.materials) || input.materials.length === 0) return error("Inclua pelo menos um material.");
  if (input.materials.length > 100) return error("Envie no máximo 100 materiais por vez.");

  let materials;
  try { materials = input.materials.map(normalizedMaterial); } catch (validationError) { return error(validationError.message); }

  try {
    await Promise.all(materials.map((material) => context.env.CADASTROS.put(
      `material:${session.companyId}:${material.id}`,
      JSON.stringify({ ...material, companyId: session.companyId, requestId: input.requestId }),
    )));
    return Response.json({ success: true, count: materials.length }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch {
    return error("Não foi possível salvar os materiais. Tente novamente.", 500);
  }
}

export function onRequest() {
  return new Response("Método não permitido.", { status: 405, headers: { Allow: "GET, POST" } });
}
