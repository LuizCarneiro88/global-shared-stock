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

  if (credentials.area === "admin" && await credentialsAreValid(credentials.email, credentials.password, context.env)) {
    const session = await createSession({ email: credentials.email, role: "admin" }, context.env);
    return Response.json(
      { success: true, destination: "/admin", role: "admin" },
      { headers: { "Set-Cookie": sessionCookie(session), "Cache-Control": "no-store" } },
    );
  }

  const account = credentials.area === "company"
    ? await sellerCredentialsAreValid(credentials.email, credentials.password, context.env)
    : null;
  if (!account) return Response.json({ message: "E-mail ou senha incorretos." }, { status: 401 });

  if (account.userId && !account.emailConfirmedAt) {
    return Response.json({ message: "Seu e-mail ainda não foi confirmado pelo link de ativação." }, { status: 403 });
  }
  if (account.userId && account.role === "additional" && !account.primaryApprovedAt) {
    return Response.json({ message: "Seu acesso aguarda a aprovação do usuário principal da empresa." }, { status: 403 });
  }
  if (account.userId && !account.adminApprovedAt) {
    return Response.json({ message: "Seu acesso aguarda a aprovação do Administrador da Global Shared Stock." }, { status: 403 });
  }
  if (!account.active) return Response.json({ message: "Este acesso está bloqueado. Consulte as aprovações pendentes." }, { status: 403 });

  const session = await createSession({ email: account.email, role: "company", companyId: account.companyId, userId: account.userId || "", userRole: account.role || "primary" }, context.env);
  return Response.json(
    { success: true, destination: "/empresa", role: "company" },
    { headers: { "Set-Cookie": sessionCookie(session), "Cache-Control": "no-store" } },
  );
}

export function onRequest() {
  return new Response("Método não permitido.", { status: 405, headers: { Allow: "POST" } });
}
