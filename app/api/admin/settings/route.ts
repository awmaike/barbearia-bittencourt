import { getAdminUser } from "../../../admin-auth";
import { getD1 } from "../../../d1";

export async function GET() {
  if (!(await getAdminUser()))
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  const database = await getD1();
  const [settings, users] = await Promise.all([
    database.prepare("SELECT * FROM business_settings").all(),
    database.prepare("SELECT * FROM admin_users ORDER BY name").all(),
  ]);
  return Response.json({
    settings: settings.results ?? [],
    users: users.results ?? [],
  });
}
export async function PUT(request: Request) {
  if (!(await getAdminUser()))
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  const body = (await request.json()) as Record<string, unknown>;
  const database = await getD1();
  if (body.type === "setting") {
    const key = String(body.key ?? ""),
      value = String(body.value ?? "");
    if (!key)
      return Response.json(
        { error: "Configuração inválida." },
        { status: 400 },
      );
    await database
      .prepare(
        "INSERT INTO business_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
      )
      .bind(key, value)
      .run();
  } else if (body.type === "user") {
    const email = String(body.email ?? "")
        .trim()
        .toLowerCase(),
      name = String(body.name ?? "").trim(),
      role = String(body.role ?? "barber");
    if (!email.includes("@") || !name)
      return Response.json(
        { error: "Informe nome e e-mail." },
        { status: 400 },
      );
    await database
      .prepare(
        "INSERT INTO admin_users (email, name, role, active) VALUES (?, ?, ?, '1') ON CONFLICT(email) DO UPDATE SET name = excluded.name, role = excluded.role, active = '1'",
      )
      .bind(email, name, role)
      .run();
  }
  return Response.json({ ok: true });
}
export async function DELETE(request: Request) {
  if (!(await getAdminUser()))
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  const email = String(
    ((await request.json()) as { email?: string }).email ?? "",
  ).toLowerCase();
  if (email === "maikeandrade36@gmail.com")
    return Response.json(
      { error: "O proprietário não pode ser removido." },
      { status: 400 },
    );
  const database = await getD1();
  await database
    .prepare("UPDATE admin_users SET active = '0' WHERE email = ?")
    .bind(email)
    .run();
  return Response.json({ ok: true });
}
