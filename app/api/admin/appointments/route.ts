import { getAdminUser } from "../../../admin-auth";
import { audit } from "../../../audit";
import { getD1 } from "../../../d1";
import {
  isBarber,
  isService,
  minutesToTime,
  SERVICES,
  slotsFor,
  timeToMinutes,
  validBusinessDate,
  validStartTime,
} from "../../../schedule";

export async function GET(request: Request) {
  if (!(await getAdminUser()))
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  const url = new URL(request.url);
  const date = url.searchParams.get("date") ?? "";
  const database = await getD1();
  const query = date
    ? database
        .prepare(
          "SELECT * FROM appointments WHERE appointment_date = ? ORDER BY start_time, barber",
        )
        .bind(date)
    : database.prepare(
        "SELECT * FROM appointments WHERE appointment_date >= date('now', '-3 hours') ORDER BY appointment_date, start_time, barber LIMIT 200",
      );
  const rows = await query.all();
  return Response.json({ appointments: rows.results ?? [] });
}

function cleanPhone(value: string) {
  return value.replace(/\D/g, "");
}

export async function POST(request: Request) {
  const admin = await getAdminUser();
  if (!admin)
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  const body = (await request.json()) as Record<string, unknown>;
  const customerName = String(body.customerName ?? "").trim(),
    phone = cleanPhone(String(body.phone ?? "")),
    service = String(body.service ?? ""),
    barber = String(body.barber ?? ""),
    date = String(body.date ?? ""),
    start = String(body.start ?? ""),
    notes = String(body.notes ?? "").slice(0, 300),
    force = Boolean(body.force);
  if (
    customerName.length < 2 ||
    phone.length < 10 ||
    !isService(service) ||
    !isBarber(barber) ||
    !validBusinessDate(date)
  )
    return Response.json({ error: "Dados inválidos." }, { status: 400 });
  const duration = SERVICES[service].duration,
    end = minutesToTime(timeToMinutes(start) + duration);
  if (
    force
      ? !/^\d{2}:\d{2}$/.test(start) ||
        timeToMinutes(start) < 480 ||
        timeToMinutes(end) > 1080
      : !validStartTime(start, duration)
  )
    return Response.json({ error: "Horário inválido." }, { status: 400 });
  const database = await getD1();
  const conflict = await database
    .prepare(
      "SELECT id FROM appointments WHERE barber = ? AND appointment_date = ? AND status = 'confirmed' AND start_time < ? AND end_time > ? LIMIT 1",
    )
    .bind(barber, date, end, start)
    .first();
  if (conflict)
    return Response.json(
      { error: "Já existe atendimento nesse período." },
      { status: 409 },
    );
  const id = crypto.randomUUID(),
    token = crypto.randomUUID().replaceAll("-", "");
  await database.batch([
    database
      .prepare(
        "INSERT INTO appointments (id, customer_name, phone, service, barber, appointment_date, start_time, end_time, notes, cancel_token, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed')",
      )
      .bind(
        id,
        customerName,
        phone,
        service,
        barber,
        date,
        start,
        end,
        notes,
        token,
      ),
    ...slotsFor(start, duration).map((slot) =>
      database
        .prepare(
          "INSERT INTO appointment_slots (appointment_id, barber, appointment_date, slot_time) VALUES (?, ?, ?, ?)",
        )
        .bind(id, barber, date, slot),
    ),
  ]);
  await audit(
    admin.email,
    "appointment_created",
    "appointment",
    id,
    `${customerName} · ${date} ${start}`,
  );
  return Response.json({ ok: true }, { status: 201 });
}

export async function PUT(request: Request) {
  const admin = await getAdminUser();
  if (!admin)
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  const body = (await request.json()) as Record<string, unknown>,
    id = String(body.id ?? "");
  const database = await getD1();
  if (body.action === "status") {
    const status = String(body.status ?? "");
    if (!["confirmed", "completed", "no_show", "cancelled"].includes(status))
      return Response.json({ error: "Status inválido." }, { status: 400 });
    const statements = [
      database
        .prepare("UPDATE appointments SET status = ? WHERE id = ?")
        .bind(status, id),
    ];
    if (status !== "confirmed")
      statements.push(
        database
          .prepare("DELETE FROM appointment_slots WHERE appointment_id = ?")
          .bind(id),
      );
    await database.batch(statements);
    await audit(admin.email, `appointment_${status}`, "appointment", id);
    return Response.json({ ok: true });
  }
  const service = String(body.service ?? ""),
    barber = String(body.barber ?? ""),
    date = String(body.date ?? ""),
    start = String(body.start ?? "");
  if (
    !id ||
    !isService(service) ||
    !isBarber(barber) ||
    !validBusinessDate(date)
  )
    return Response.json({ error: "Dados inválidos." }, { status: 400 });
  const duration = SERVICES[service].duration,
    end = minutesToTime(timeToMinutes(start) + duration);
  if (!validStartTime(start, duration))
    return Response.json({ error: "Horário inválido." }, { status: 400 });
  const conflict = await database
    .prepare(
      "SELECT id FROM appointments WHERE id <> ? AND barber = ? AND appointment_date = ? AND status = 'confirmed' AND start_time < ? AND end_time > ? LIMIT 1",
    )
    .bind(id, barber, date, end, start)
    .first();
  if (conflict)
    return Response.json(
      { error: "Já existe atendimento nesse período." },
      { status: 409 },
    );
  await database.batch([
    database
      .prepare("DELETE FROM appointment_slots WHERE appointment_id = ?")
      .bind(id),
    database
      .prepare(
        "UPDATE appointments SET service = ?, barber = ?, appointment_date = ?, start_time = ?, end_time = ?, status = 'confirmed' WHERE id = ?",
      )
      .bind(service, barber, date, start, end, id),
    ...slotsFor(start, duration).map((slot) =>
      database
        .prepare(
          "INSERT INTO appointment_slots (appointment_id, barber, appointment_date, slot_time) VALUES (?, ?, ?, ?)",
        )
        .bind(id, barber, date, slot),
    ),
  ]);
  await audit(
    admin.email,
    "appointment_updated",
    "appointment",
    id,
    `${date} ${start} · ${barber}`,
  );
  return Response.json({ ok: true });
}

export async function DELETE(request: Request) {
  const admin = await getAdminUser();
  if (!admin)
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  const body = (await request.json()) as { id?: string };
  const id = String(body.id ?? "");
  if (!id)
    return Response.json({ error: "Agendamento inválido." }, { status: 400 });
  const database = await getD1();
  await database.batch([
    database
      .prepare("DELETE FROM appointment_slots WHERE appointment_id = ?")
      .bind(id),
    database
      .prepare("UPDATE appointments SET status = 'cancelled' WHERE id = ?")
      .bind(id),
  ]);
  await audit(admin.email, "appointment_cancelled", "appointment", id);
  return Response.json({ ok: true });
}
