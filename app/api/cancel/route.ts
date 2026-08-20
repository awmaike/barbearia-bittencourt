import { getD1 } from "../../d1";
import {
  isService,
  minutesToTime,
  SERVICES,
  slotsFor,
  timeToMinutes,
  validBusinessDate,
  validStartTime,
} from "../../schedule";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token") ?? "";
  if (!/^[a-f0-9]{32}$/.test(token))
    return Response.json({ error: "Link inválido." }, { status: 400 });
  const database = await getD1();
  const appointment = await database
    .prepare(
      "SELECT customer_name, service, barber, appointment_date, start_time, end_time, status FROM appointments WHERE cancel_token = ?",
    )
    .bind(token)
    .first();
  if (!appointment)
    return Response.json(
      { error: "Agendamento não encontrado." },
      { status: 404 },
    );
  return Response.json({ appointment });
}

export async function PUT(request: Request) {
  const body = (await request.json()) as {
    token?: string;
    date?: string;
    start?: string;
  };
  const token = String(body.token ?? ""),
    date = String(body.date ?? ""),
    start = String(body.start ?? "");
  if (!/^[a-f0-9]{32}$/.test(token) || !validBusinessDate(date))
    return Response.json({ error: "Dados inválidos." }, { status: 400 });
  const database = await getD1();
  const appointment = await database
    .prepare(
      "SELECT id, service, barber, status FROM appointments WHERE cancel_token = ?",
    )
    .bind(token)
    .first<{ id: string; service: string; barber: string; status: string }>();
  if (
    !appointment ||
    appointment.status !== "confirmed" ||
    !isService(appointment.service)
  )
    return Response.json(
      { error: "Este agendamento não pode ser reagendado." },
      { status: 409 },
    );
  const duration = SERVICES[appointment.service].duration,
    end = minutesToTime(timeToMinutes(start) + duration);
  if (!validStartTime(start, duration))
    return Response.json({ error: "Horário inválido." }, { status: 400 });
  const conflict = await database
    .prepare(
      "SELECT id FROM appointments WHERE id <> ? AND barber = ? AND appointment_date = ? AND status = 'confirmed' AND start_time < ? AND end_time > ? LIMIT 1",
    )
    .bind(appointment.id, appointment.barber, date, end, start)
    .first();
  if (conflict)
    return Response.json(
      { error: "Esse horário não está mais disponível." },
      { status: 409 },
    );
  await database.batch([
    database
      .prepare("DELETE FROM appointment_slots WHERE appointment_id = ?")
      .bind(appointment.id),
    database
      .prepare(
        "UPDATE appointments SET appointment_date = ?, start_time = ?, end_time = ? WHERE id = ?",
      )
      .bind(date, start, end, appointment.id),
    ...slotsFor(start, duration).map((slot) =>
      database
        .prepare(
          "INSERT INTO appointment_slots (appointment_id, barber, appointment_date, slot_time) VALUES (?, ?, ?, ?)",
        )
        .bind(appointment.id, appointment.barber, date, slot),
    ),
  ]);
  return Response.json({
    ok: true,
    appointment: { appointment_date: date, start_time: start, end_time: end },
  });
}

export async function DELETE(request: Request) {
  const token = String(
    ((await request.json()) as { token?: string }).token ?? "",
  );
  if (!/^[a-f0-9]{32}$/.test(token))
    return Response.json({ error: "Link inválido." }, { status: 400 });
  const database = await getD1();
  const appointment = await database
    .prepare("SELECT id, status FROM appointments WHERE cancel_token = ?")
    .bind(token)
    .first<{ id: string; status: string }>();
  if (!appointment)
    return Response.json(
      { error: "Agendamento não encontrado." },
      { status: 404 },
    );
  if (appointment.status === "cancelled") return Response.json({ ok: true });
  await database.batch([
    database
      .prepare("DELETE FROM appointment_slots WHERE appointment_id = ?")
      .bind(appointment.id),
    database
      .prepare("UPDATE appointments SET status = 'cancelled' WHERE id = ?")
      .bind(appointment.id),
  ]);
  return Response.json({ ok: true });
}
