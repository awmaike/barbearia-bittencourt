export async function GET(request: Request) {
  const support = new URL(request.url).searchParams.get("scope") === "support";
  const response = Response.redirect(new URL("/admin/login", request.url), 302);
  response.headers.set(
    "set-cookie",
    `${support ? "bittencourt_support_access" : "bittencourt_admin_access"}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`,
  );
  return response;
}
