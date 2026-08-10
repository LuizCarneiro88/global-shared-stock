const MAXIMUM_FILE_SIZE = 10 * 1024 * 1024;
const MAXIMUM_REQUEST_SIZE = 90 * 1024 * 1024;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INTERESTS = new Set(["buy", "sell", "both"]);
const INVENTORY_SIZES = new Set(["under-100k", "100k-to-999k", "1m-to-5m", "over-5m"]);

function text(formData, name) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function digitsOnly(value) {
  return value.replace(/\D/g, "");
}

function isValidCnpj(value) {
  const cnpj = digitsOnly(value);
  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false;

  const calculateDigit = (base, weights) => {
    const total = [...base].reduce((sum, digit, index) => sum + Number(digit) * weights[index], 0);
    const remainder = total % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  const firstDigit = calculateDigit(cnpj.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const secondDigit = calculateDigit(`${cnpj.slice(0, 12)}${firstDigit}`, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return cnpj.endsWith(`${firstDigit}${secondDigit}`);
}

async function isPdf(file) {
  if (!(file instanceof File) || !file.name.toLowerCase().endsWith(".pdf")) return false;
  if (file.type && file.type !== "application/pdf") return false;
  const header = new Uint8Array(await file.slice(0, 5).arrayBuffer());
  return new TextDecoder().decode(header) === "%PDF-";
}

function error(message, status = 400) {
  return Response.json({ message }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function onRequestPost(context) {
  if (!context.env.CADASTROS) return error("O armazenamento ainda não está configurado.", 503);

  const contentLength = Number(context.request.headers.get("Content-Length") || 0);
  if (contentLength > MAXIMUM_REQUEST_SIZE) return error("O conjunto de arquivos é muito grande.", 413);

  let formData;
  try {
    formData = await context.request.formData();
  } catch {
    return error("Não foi possível ler os dados enviados.");
  }

  const requestId = text(formData, "request-id");
  const companyName = text(formData, "company-name");
  const cnpj = digitsOnly(text(formData, "cnpj"));
  const primaryContact = text(formData, "primary-contact");
  const primaryEmail = text(formData, "primary-email").toLowerCase();
  const copyEmailOne = text(formData, "copy-email-one").toLowerCase();
  const copyEmailTwo = text(formData, "copy-email-two").toLowerCase();
  const interest = text(formData, "interest");
  const inventorySize = text(formData, "inventory-size");
  const cnpjDocument = formData.get("cnpj-document");
  const companyDocuments = formData.getAll("company-documents");

  if (!UUID_PATTERN.test(requestId)) return error("Identificação da solicitação inválida. Atualize a página e tente novamente.");
  if (!companyName || !primaryContact || !primaryEmail) return error("Preencha todos os campos obrigatórios.");
  if (!isValidCnpj(cnpj)) return error("Informe um CNPJ válido.");
  if (![primaryEmail, copyEmailOne, copyEmailTwo].filter(Boolean).every((email) => EMAIL_PATTERN.test(email))) {
    return error("Informe endereços de e-mail válidos.");
  }
  if (!INTERESTS.has(interest) || !INVENTORY_SIZES.has(inventorySize)) {
    return error("Selecione as opções obrigatórias do perfil comercial.");
  }
  if (!(cnpjDocument instanceof File) || companyDocuments.length === 0) {
    return error("Envie o cartão CNPJ e o contrato social.");
  }

  const files = [cnpjDocument, ...companyDocuments];
  for (const file of files) {
    if (file.size <= 0) return error(`O arquivo “${file.name}” está vazio.`);
    if (file.size > MAXIMUM_FILE_SIZE) return error(`O arquivo “${file.name}” ultrapassa o limite de 10 MB.`);
    if (!(await isPdf(file))) return error(`O arquivo “${file.name}” não é um PDF válido.`);
  }

  try {
    const documentRecords = [];
    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];
      const documentId = `${index + 1}`;
      await context.env.CADASTROS.put(`cadastro:${requestId}:documento:${documentId}`, await file.arrayBuffer());
      documentRecords.push({ id: documentId, name: file.name, type: file.type || "application/pdf", size: file.size });
    }

    const record = {
      id: requestId,
      companyName,
      cnpj,
      stateRegistration: text(formData, "state-registration"),
      cityRegistration: text(formData, "city-registration"),
      primaryContact,
      primaryEmail,
      copyEmailOne,
      copyEmailTwo,
      interest,
      inventorySize,
      documents: documentRecords,
      status: "pending",
      receivedAt: new Date().toISOString(),
    };

    await context.env.CADASTROS.put(`cadastro:${requestId}:dados`, JSON.stringify(record));
    return Response.json({ success: true, id: requestId }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch {
    return error("Não foi possível salvar o cadastro. Tente novamente.", 500);
  }
}

export async function onRequestGet(context) {
  if (!context.env.CADASTROS) return error("O armazenamento ainda não está configurado.", 503);

  try {
    const companies = [];
    let cursor;
    do {
      const page = await context.env.CADASTROS.list({ prefix: "cadastro:", cursor });
      const dataKeys = page.keys.filter((key) => key.name.endsWith(":dados"));
      const records = await Promise.all(dataKeys.map((key) => context.env.CADASTROS.get(key.name, "json")));
      companies.push(...records.filter(Boolean));
      cursor = page.list_complete ? undefined : page.cursor;
    } while (cursor);

    companies.sort((first, second) => second.receivedAt.localeCompare(first.receivedAt));
    return Response.json({ companies }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return error("Não foi possível carregar as solicitações.", 500);
  }
}

export function onRequest() {
  return new Response("Método não permitido.", { status: 405, headers: { Allow: "GET, POST" } });
}
