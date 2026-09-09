import { INTEREST_ID_PATTERN } from "../_commission.js";
import { onRequestPost as submitPurchaseOrder } from "./interesses/[id]/ordem-compra.js";

function error(message, status = 400) {
  return Response.json({ message }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function onRequestPost(context) {
  const id = new URL(context.request.url).searchParams.get("negociacao") || "";
  if (!INTEREST_ID_PATTERN.test(id)) return error("Negociação inválida.");
  return submitPurchaseOrder({ ...context, params: { ...context.params, id } });
}

export function onRequest() {
  return new Response("Método não permitido.", { status: 405, headers: { Allow: "POST" } });
}
