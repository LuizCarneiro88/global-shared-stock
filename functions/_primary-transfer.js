const TOKEN_DURATION_SECONDS = 48 * 60 * 60;

export const TRANSFER_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function bytesToBase64Url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

export async function tokenHash(token) {
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token)));
  return bytesToBase64Url(digest);
}

export async function listCompanyUsers(env, companyId) {
  const users = [];
  let cursor;
  do {
    const page = await env.CADASTROS.list({ prefix: "usuario:", cursor });
    const records = await Promise.all(page.keys.map((key) => env.CADASTROS.get(key.name, "json")));
    users.push(...records.filter((user) => user?.companyId === companyId));
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);
  return users;
}

export async function createConfirmation(env, transfer, requestUrl) {
  const token = bytesToBase64Url(crypto.getRandomValues(new Uint8Array(32)));
  const hash = await tokenHash(token);
  await env.CADASTROS.put(`transferencia-principal-token:${hash}`, JSON.stringify({ transferId: transfer.id, companyId: transfer.companyId, newPrimaryUserId: transfer.newPrimaryUserId, expiresAt: Date.now() + TOKEN_DURATION_SECONDS * 1000 }), { expirationTtl: TOKEN_DURATION_SECONDS });
  const link = new URL("/confirmar-transferencia", requestUrl);
  link.searchParams.set("token", token);
  return link.toString();
}

export function publicTransfer(transfer) {
  const { confirmationTokenHash, ...safe } = transfer;
  return safe;
}
