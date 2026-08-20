import { getAdminToken, getAdminUser } from "../../../admin-auth";
import { audit } from "../../../audit";

export async function PUT(request: Request) {
  const admin = await getAdminUser();
  const token = await getAdminToken();
  if (!admin || !token)
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  const password = String(
    ((await request.json()) as { password?: string }).password ?? "",
  );
  if (
    password.length < 10 ||
    !/[a-z]/.test(password) ||
    !/[A-Z]/.test(password) ||
    !/\d/.test(password) ||
    !/[^A-Za-z0-9]/.test(password)
  )
    return Response.json(
      {
        error:
          "Use 10 caracteres ou mais, com maiúscula, minúscula, número e símbolo.",
      },
      { status: 400 },
    );
  const url = process.env.SUPABASE_URL,
    key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key)
    return Response.json({ error: "Login não configurado." }, { status: 503 });
  const response = await fetch(`${url}/auth/v1/user`, {
    method: "PUT",
    headers: {
      apikey: key,
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ password }),
  });
  if (!response.ok)
    return Response.json(
      { error: "Não foi possível alterar a senha." },
      { status: 400 },
    );
  await audit(admin.email, "password_changed", "admin");
  return Response.json({ ok: true });
}
