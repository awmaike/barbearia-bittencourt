import { getAdminUser } from "../../../admin-auth";
import { getD1 } from "../../../d1";
import { isBarber } from "../../../schedule";

export async function GET() {
  if (!(await getAdminUser()))
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  const database = await getD1();
  const rows = await database
    .prepare("SELECT * FROM barber_hours ORDER BY barber, weekday")
    .all();
  return Response.json({ hours: rows.results ?? [] });
}

export async function PUT(request: Request) {
  if (!(await getAdminUser()))
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  const body = (await request.json()) as Record<string, unknown>;
  const barber = String(body.barber ?? ""),
    weekday = String(body.weekday ?? ""),
    start = String(body.start ?? "08:00"),
    end = String(body.end ?? "18:00"),
    enabled = body.enabled ? "1" : "0";
  if (!isBarber(barber) || !/^[0-6]$/.test(weekday))
    return Response.json({ error: "Dados inválidos." }, { status: 400 });
  const database = await getD1();
  await database
    .prepare(
      "INSERT INTO barber_hours (barber, weekday, enabled, start_time, end_time) VALUES (?, ?, ?, ?, ?) ON CONFLICT(barber, weekday) DO UPDATE SET enabled = excluded.enabled, start_time = excluded.start_time, end_time = excluded.end_time",
    )
    .bind(barber, weekday, enabled, start, end)
    .run();
  return Response.json({ ok: true });
}
