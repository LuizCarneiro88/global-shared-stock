import { expiredSessionCookie } from "../_auth.js";

export function onRequestPost(context) {
  return new Response(null, {
    status: 303,
    headers: {
      Location: new URL("/login", context.request.url).toString(),
      "Set-Cookie": expiredSessionCookie(),
      "Cache-Control": "no-store",
    },
  });
}

export function onRequest() {
  return new Response("Método não permitido.", { status: 405, headers: { Allow: "POST" } });
}
