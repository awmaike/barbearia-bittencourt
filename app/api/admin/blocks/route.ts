import { getAdminUser } from "../../../admin-auth";
import { getD1 } from "../../../d1";
import { isBarber, timeToMinutes, validBusinessDate } from "../../../schedule";

export async function GET(request: Request) {
  if (!(await getAdminUser()))
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  const date = new URL(request.url).searchParams.get("date") ?? "";
  const database = await getD1();
  const rows = await database
    .prepare(
      "SELECT * FROM schedule_blocks WHERE appointment_date = ? ORDER BY start_time",
    )
    .bind(date)
    .all();
  return Response.json({ blocks: rows.results ?? [] });
}

export async function POST(request: Request) {
  if (!(await getAdminUser()))
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  const body = (await request.json()) as Record<string, unknown>;
  const barber = String(body.barber ?? ""),
    date = String(body.date ?? ""),
    start = String(body.start ?? ""),
    end = String(body.end ?? ""),
    reason = String(body.reason ?? "Horário bloqueado").slice(0, 100);
  if (
    !isBarber(barber) ||
    !validBusinessDate(date) ||
    timeToMinutes(start) >= timeToMinutes(end)
  )
    return Response.json({ error: "Dados inválidos." }, { status: 400 });
  const database = await getD1();
  const conflict = await database
    .prepare(
      "SELECT id FROM appointments WHERE barber = ? AND appointment_date = ? AND status = 'confirmed' AND start_time < ? AND end_time > ? LIMIT 1",
    )
    .bind(barber, date, end, start)
    .first();
  if (conflict)
    return Response.json(
      { error: "Já existe um cliente agendado nesse período." },
      { status: 409 },
    );
  await database
    .prepare(
      "INSERT INTO schedule_blocks (id, barber, appointment_date, start_time, end_time, reason) VALUES (?, ?, ?, ?, ?, ?)",
    )
    .bind(crypto.randomUUID(), barber, date, start, end, reason)
    .run();
  return Response.json({ ok: true }, { status: 201 });
}

export async function DELETE(request: Request) {
  if (!(await getAdminUser()))
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  const id = String(((await request.json()) as { id?: string }).id ?? "");
  const database = await getD1();
  await database
    .prepare("DELETE FROM schedule_blocks WHERE id = ?")
    .bind(id)
    .run();
  return Response.json({ ok: true });
}
