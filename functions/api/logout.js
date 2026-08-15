import { expiredSessionCookie, getSession } from "../_auth.js";

export async function onRequestPost(context) {
  const session = await getSession(context.request, context.env);
  const destination = session?.role === "company" ? "/login-empresa" : "/login";
  return new Response(null, {
    status: 303,
    headers: {
      Location: new URL(destination, context.request.url).toString(),
      "Set-Cookie": expiredSessionCookie(),
      "Cache-Control": "no-store",
    },
  });
}

export function onRequest() {
  return new Response("Método não permitido.", { status: 405, headers: { Allow: "POST" } });
}
