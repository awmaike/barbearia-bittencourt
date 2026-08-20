import {
  isBarber,
  isService,
  minutesToTime,
  SERVICES,
  timeToMinutes,
  validBusinessDate,
} from "../../schedule";
import { getD1 } from "../../d1";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const date = url.searchParams.get("date") ?? "";
  const barber = url.searchParams.get("barber") ?? "";
  const service = url.searchParams.get("service") ?? "";
  if (!validBusinessDate(date) || !isBarber(barber) || !isService(service)) {
    return Response.json(
      { error: "Dados de busca inválidos." },
      { status: 400 },
    );
  }

  const database = await getD1();
  const maintenance = await database
    .prepare(
      "SELECT value FROM business_settings WHERE key='booking_maintenance'",
    )
    .first<{ value: string }>();
  if (maintenance?.value === "1")
    return Response.json({
      times: [],
      maintenance: true,
      message: "Agenda temporariamente em manutenção.",
    });
  const occupied = await database
    .prepare(
      "SELECT start_time, end_time FROM appointments WHERE barber = ? AND appointment_date = ? AND status = 'confirmed'",
    )
    .bind(barber, date)
    .all<{ start_time: string; end_time: string }>();
  const blocks = await database
    .prepare(
      "SELECT start_time, end_time FROM schedule_blocks WHERE barber = ? AND appointment_date = ?",
    )
    .bind(barber, date)
    .all<{ start_time: string; end_time: string }>();
  const weekday = String(new Date(`${date}T12:00:00-03:00`).getDay());
  const hours = await database
    .prepare(
      "SELECT enabled, start_time, end_time FROM barber_hours WHERE barber = ? AND weekday = ?",
    )
    .bind(barber, weekday)
    .first<{ enabled: string; start_time: string; end_time: string }>();
  if (hours?.enabled === "0") return Response.json({ times: [] });
  const dayStart = timeToMinutes(hours?.start_time ?? "08:00");
  const dayEnd = timeToMinutes(hours?.end_time ?? "18:00");
  const duration = SERVICES[service].duration;
  const times: string[] = [];
  for (let minute = dayStart; minute + duration <= dayEnd; minute += 15) {
    const overlapsAppointment = (occupied.results ?? []).some(
      (item) =>
        minute < timeToMinutes(item.end_time) &&
        minute + duration > timeToMinutes(item.start_time),
    );
    const overlapsBlock = (blocks.results ?? []).some(
      (block) =>
        minute < timeToMinutes(block.end_time) &&
        minute + duration > timeToMinutes(block.start_time),
    );
    if (!overlapsAppointment && !overlapsBlock)
      times.push(minutesToTime(minute));
  }
  return Response.json({ times });
}
