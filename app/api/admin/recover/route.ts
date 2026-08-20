export async function POST(request: Request) {
  const username = String(((await request.json()) as { username?: string }).username ?? "").trim().toLowerCase();
  let loginMap: Record<string, string> = {};
  try { loginMap = JSON.parse(process.env.ADMIN_LOGIN_MAP ?? "{}"); } catch {}
  const email = loginMap[username];
  const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (email && url && key) {
    const origin = new URL(request.url).origin;
    await fetch(`${url}/auth/v1/recover?redirect_to=${encodeURIComponent(`${origin}/admin/redefinir-senha`)}`, { method: "POST", headers: { apikey: key, "content-type": "application/json" }, body: JSON.stringify({ email }) });
  }
  return Response.json({ message: "Se o usuário existir, as instruções serão enviadas ao e-mail cadastrado." });
}
