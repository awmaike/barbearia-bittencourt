export async function POST(request: Request) {
  const { token, password } = (await request.json()) as { token?: string; password?: string };
  if (!token || !password || password.length < 10 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password) || !/[^A-Za-z0-9]/.test(password)) return Response.json({ error: "Use 10 caracteres ou mais, com maiúscula, minúscula, número e símbolo." }, { status: 400 });
  const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return Response.json({ error: "Serviço indisponível." }, { status: 503 });
  const response = await fetch(`${url}/auth/v1/user`, { method: "PUT", headers: { apikey: key, authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify({ password }) });
  if (!response.ok) return Response.json({ error: "O link expirou. Solicite outro." }, { status: 400 });
  return Response.json({ ok: true });
}
