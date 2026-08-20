import {
  isBarber,
  isService,
  minutesToTime,
  SERVICES,
  slotsFor,
  timeToMinutes,
  validBusinessDate,
  validStartTime,
} from "../../schedule";
import { getD1 } from "../../d1";
import { logError } from "../../error-log";
import { ensureDailyBackup } from "../../backup";

function cleanPhone(value: string) {
  return value.replace(/\D/g, "");
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const customerName = String(body.customerName ?? "").trim();
    const phone = cleanPhone(String(body.phone ?? ""));
    const barber = String(body.barber ?? "");
    const service = String(body.service ?? "");
    const appointmentDate = String(body.appointmentDate ?? "");
    const startTime = String(body.startTime ?? "");
    const notes = String(body.notes ?? "")
      .trim()
      .slice(0, 300);
    if (
      customerName.length < 2 ||
      customerName.length > 80 ||
      phone.length < 10 ||
      phone.length > 13
    ) {
      return Response.json(
        { error: "Informe um nome e telefone válidos." },
        { status: 400 },
      );
    }
    if (
      !isBarber(barber) ||
      !isService(service) ||
      !validBusinessDate(appointmentDate)
    ) {
      return Response.json(
        { error: "Serviço, profissional ou data inválidos." },
        { status: 400 },
      );
    }
    const duration = SERVICES[service].duration;
    if (!validStartTime(startTime, duration)) {
      return Response.json({ error: "Horário inválido." }, { status: 400 });
    }

    const database = await getD1();
    const maintenance = await database
      .prepare(
        "SELECT value FROM business_settings WHERE key='booking_maintenance'",
      )
      .first<{ value: string }>();
    if (maintenance?.value === "1")
      return Response.json(
        {
          error:
            "A agenda está em manutenção. Tente novamente em alguns minutos.",
        },
        { status: 503 },
      );
    const id = crypto.randomUUID();
    const cancelToken = crypto.randomUUID().replaceAll("-", "");
    const endTime = minutesToTime(timeToMinutes(startTime) + duration);
    const weekday = String(
      new Date(`${appointmentDate}T12:00:00-03:00`).getDay(),
    );
    const hours = await database
      .prepare(
        "SELECT enabled, start_time, end_time FROM barber_hours WHERE barber = ? AND weekday = ?",
      )
      .bind(barber, weekday)
      .first<{ enabled: string; start_time: string; end_time: string }>();
    if (
      hours?.enabled === "0" ||
      (hours &&
        (timeToMinutes(startTime) < timeToMinutes(hours.start_time) ||
          timeToMinutes(endTime) > timeToMinutes(hours.end_time)))
    )
      return Response.json(
        { error: "O profissional não atende nesse horário." },
        { status: 409 },
      );
    const block = await database
      .prepare(
        "SELECT id FROM schedule_blocks WHERE barber = ? AND appointment_date = ? AND start_time < ? AND end_time > ? LIMIT 1",
      )
      .bind(barber, appointmentDate, endTime, startTime)
      .first();
    if (block)
      return Response.json(
        { error: "Esse horário está bloqueado. Escolha outro." },
        { status: 409 },
      );
    const overlap = await database
      .prepare(
        "SELECT id FROM appointments WHERE barber = ? AND appointment_date = ? AND status = 'confirmed' AND start_time < ? AND end_time > ? LIMIT 1",
      )
      .bind(barber, appointmentDate, endTime, startTime)
      .first();
    if (overlap)
      return Response.json(
        { error: "Esse horário acabou de ser reservado. Escolha outro." },
        { status: 409 },
      );
    const statements = [
      database
        .prepare(
          "INSERT INTO appointments (id, customer_name, phone, service, barber, appointment_date, start_time, end_time, notes, cancel_token, payment_status, payment_method, amount_paid, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'pix', '0', 'confirmed')",
        )
        .bind(
          id,
          customerName,
          phone,
          service,
          barber,
          appointmentDate,
          startTime,
          endTime,
          notes,
          cancelToken,
        ),
      ...slotsFor(startTime, duration).map((slot) =>
        database
          .prepare(
            "INSERT INTO appointment_slots (appointment_id, barber, appointment_date, slot_time) VALUES (?, ?, ?, ?)",
          )
          .bind(id, barber, appointmentDate, slot),
      ),
    ];
    await database.batch(statements);
    try { await ensureDailyBackup(); } catch (backupError) { await logError("/api/appointments/backup", backupError); }
    return Response.json(
      {
        appointment: {
          id,
          customerName,
          phone,
          service,
          barber,
          appointmentDate,
          startTime,
          endTime,
          cancelToken,
          depositAmount: 10,
          pixKey: "00000000000",
        },
      },
      { status: 201 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("UNIQUE") || message.includes("constraint")) {
      return Response.json(
        { error: "Esse horário acabou de ser reservado. Escolha outro." },
        { status: 409 },
      );
    }
    await logError("/api/appointments", error);
    return Response.json(
      { error: "Não foi possível concluir o agendamento." },
      { status: 500 },
    );
  }
}
