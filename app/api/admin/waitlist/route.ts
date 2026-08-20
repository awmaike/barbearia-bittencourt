import { getAdminUser } from "../../../admin-auth";
import { getD1 } from "../../../d1";

export async function GET() {
  if (!(await getAdminUser()))
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  const database = await getD1();
  const rows = await database
    .prepare(
      "SELECT * FROM waitlist WHERE status = 'waiting' ORDER BY preferred_date, created_at",
    )
    .all();
  return Response.json({ waitlist: rows.results ?? [] });
}
export async function POST(request: Request) {
  if (!(await getAdminUser()))
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  const body = (await request.json()) as Record<string, unknown>;
  const name = String(body.name ?? "").trim(),
    phone = String(body.phone ?? "").replace(/\D/g, ""),
    date = String(body.date ?? ""),
    period = String(body.period ?? "Qualquer horário"),
    service = String(body.service ?? "corte"),
    barber = String(body.barber ?? "Pedrinho");
  if (name.length < 2 || phone.length < 10 || !date)
    return Response.json(
      { error: "Preencha nome, telefone e data." },
      { status: 400 },
    );
  const database = await getD1();
  await database
    .prepare(
      "INSERT INTO waitlist (id, customer_name, phone, preferred_date, preferred_period, service, barber, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'waiting')",
    )
    .bind(crypto.randomUUID(), name, phone, date, period, service, barber)
    .run();
  return Response.json({ ok: true }, { status: 201 });
}
export async function DELETE(request: Request) {
  if (!(await getAdminUser()))
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  const id = String(((await request.json()) as { id?: string }).id ?? "");
  const database = await getD1();
  await database
    .prepare("UPDATE waitlist SET status = 'contacted' WHERE id = ?")
    .bind(id)
    .run();
  return Response.json({ ok: true });
}
