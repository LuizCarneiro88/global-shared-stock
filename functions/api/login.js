import { configuredCredentials, createSession, credentialsAreValid, sellerCredentialsAreValid, sessionCookie } from "../_auth.js";

export async function onRequestPost(context) {
  if (!configuredCredentials(context.env)) {
    return Response.json({ message: "O acesso ainda não foi configurado." }, { status: 503 });
  }

  let credentials;
  try {
    credentials = await context.request.json();
  } catch {
    return Response.json({ message: "Não foi possível ler os dados informados." }, { status: 400 });
  }

  if (await credentialsAreValid(credentials.email, credentials.password, context.env)) {
    const session = await createSession({ email: credentials.email, role: "admin" }, context.env);
    return Response.json(
      { success: true, destination: "/admin", role: "admin" },
      { headers: { "Set-Cookie": sessionCookie(session), "Cache-Control": "no-store" } },
    );
  }

  const account = await sellerCredentialsAreValid(credentials.email, credentials.password, context.env);
  if (!account) return Response.json({ message: "E-mail ou senha incorretos." }, { status: 401 });

  const session = await createSession({ email: account.email, role: "company", companyId: account.companyId }, context.env);
  return Response.json(
    { success: true, destination: "/empresa", role: "company" },
    { headers: { "Set-Cookie": sessionCookie(session), "Cache-Control": "no-store" } },
  );
}

export function onRequest() {
  return new Response("Método não permitido.", { status: 405, headers: { Allow: "POST" } });
}
