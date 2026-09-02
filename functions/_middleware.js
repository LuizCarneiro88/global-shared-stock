import { getSession } from "./_auth.js";

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const publicRequest =
    url.pathname === "/api/login" ||
    url.pathname === "/api/acesso/ativar" ||
    url.pathname === "/api/acesso/redefinir" ||
    url.pathname === "/api/anuncios" ||
    url.pathname.startsWith("/api/anuncios/") ||
    url.pathname === "/anuncios" ||
    url.pathname === "/anuncios.html" ||
    url.pathname === "/redefinir-senha" ||
    url.pathname === "/redefinir-senha.html" ||
    (url.pathname === "/api/cadastros" && context.request.method === "POST");

  if (publicRequest) return context.next();

  const session = await getSession(context.request, context.env);
  if (url.pathname === "/api/logout" && session) return context.next();
  if (url.pathname === "/api/interesses") {
    const allowedInterestRequest = ["GET", "POST"].includes(context.request.method) ? session?.role === "company" || (context.request.method === "GET" && session?.role === "admin") : false;
    if (allowedInterestRequest) return context.next();
  }
  if (url.pathname.startsWith("/api/interesses/") && context.request.method === "PATCH" && ["admin", "company"].includes(session?.role)) return context.next();
  const companyArea = url.pathname === "/empresa" || url.pathname.startsWith("/empresa/") || url.pathname.startsWith("/api/empresa");
  const allowed = companyArea ? session?.role === "company" : session?.role === "admin";
  if (allowed) return context.next();

  const loginUrl = new URL(companyArea ? "/login-empresa" : "/login", url.origin);
  loginUrl.searchParams.set("next", `${url.pathname}${url.search}`);
  return Response.redirect(loginUrl, 302);
}
