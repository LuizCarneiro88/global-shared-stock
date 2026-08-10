import { configuredCredentials, createSession, credentialsAreValid, sessionCookie } from "../_auth.js";

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

  if (!(await credentialsAreValid(credentials.email, credentials.password, context.env))) {
    return Response.json({ message: "E-mail ou senha incorretos." }, { status: 401 });
  }

  const session = await createSession(credentials.email, context.env);
  return Response.json(
    { success: true },
    { headers: { "Set-Cookie": sessionCookie(session), "Cache-Control": "no-store" } },
  );
}

export function onRequest() {
  return new Response("Método não permitido.", { status: 405, headers: { Allow: "POST" } });
}
