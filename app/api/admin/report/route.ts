import { getAdminUser } from "../../../admin-auth";
import { getD1 } from "../../../d1";

const prices: Record<string, number> = {
  corte: 40,
  barba: 30,
  sobrancelha: 15,
  combo: 70,
  corte_sobrancelha: 55,
  barba_sobrancelha: 45,
  corte_barba_sobrancelha: 85,
};
export async function GET(request: Request) {
  if (!(await getAdminUser()))
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  const month =
    new URL(request.url).searchParams.get("month") ??
    new Date().toISOString().slice(0, 7);
  const database = await getD1();
  const monthDate = new Date(`${month}-01T12:00:00`);
  monthDate.setMonth(monthDate.getMonth() - 1);
  const previousMonth = monthDate.toISOString().slice(0, 7);
  const [appointments, previousAppointments, settings] = await Promise.all([
    database
      .prepare(
        "SELECT barber, service, status FROM appointments WHERE appointment_date LIKE ?",
      )
      .bind(`${month}%`)
      .all<{ barber: string; service: string; status: string }>(),
    database
      .prepare(
        "SELECT barber, service, status FROM appointments WHERE appointment_date LIKE ?",
      )
      .bind(`${previousMonth}%`)
      .all<{ barber: string; service: string; status: string }>(),
    database
      .prepare(
        "SELECT key, value FROM business_settings WHERE key LIKE 'commission_%'",
      )
      .all<{ key: string; value: string }>(),
  ]);
  const commission = Object.fromEntries(
    (settings.results ?? []).map((item) => [item.key, Number(item.value) || 0]),
  );
  const rows = ["Pedrinho", "Treco"].map((barber) => {
    const items = (appointments.results ?? []).filter(
      (item) =>
        item.barber === barber &&
        ["confirmed", "completed"].includes(item.status),
    );
    const revenue = items.reduce(
      (sum, item) => sum + (prices[item.service] ?? 0),
      0,
    );
    const rate = commission[`commission_${barber.toLowerCase()}`] ?? 0;
    return {
      barber,
      appointments: items.length,
      revenue,
      commissionRate: rate,
      commissionValue: (revenue * rate) / 100,
    };
  });
  const totalRevenue = rows.reduce((sum, item) => sum + item.revenue, 0);
  const previousRevenue = (previousAppointments.results ?? [])
    .filter((item) => ["confirmed", "completed"].includes(item.status))
    .reduce((sum, item) => sum + (prices[item.service] ?? 0), 0);
  return Response.json({
    month,
    previousMonth,
    rows,
    totalRevenue,
    previousRevenue,
    changePercent:
      previousRevenue > 0
        ? ((totalRevenue - previousRevenue) / previousRevenue) * 100
        : null,
    cancellations: (appointments.results ?? []).filter(
      (item) => item.status === "cancelled",
    ).length,
    noShows: (appointments.results ?? []).filter(
      (item) => item.status === "no_show",
    ).length,
  });
}
