import { sessionIsValid } from "./_auth.js";

export async function onRequest(context) {
  const url = new URL(context.request.url);

  if (url.pathname === "/api/login") {
    return context.next();
  }

  if (await sessionIsValid(context.request, context.env)) {
    return context.next();
  }

  const loginUrl = new URL("/login", url.origin);
  loginUrl.searchParams.set("next", `${url.pathname}${url.search}`);
  return Response.redirect(loginUrl, 302);
}
