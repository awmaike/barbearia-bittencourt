import { getSupportUser } from "../../../admin-auth";
import { getD1 } from "../../../d1";
export async function GET(request: Request) {
  if (!(await getSupportUser()))
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  const phone = (new URL(request.url).searchParams.get("phone") || "")
    .replace(/\D/g, "")
    .slice(0, 13);
  const db = await getD1();
  const rows = await db
    .prepare(
      "SELECT id,appointment_date,start_time,service,barber,status,payment_status,amount_paid FROM appointments WHERE phone=? ORDER BY appointment_date DESC,start_time DESC LIMIT 100",
    )
    .bind(phone)
    .all();
  const summary = await db
    .prepare(
      "SELECT customer_name,COUNT(*) visits,SUM(CASE WHEN status='cancelled' THEN 1 ELSE 0 END) cancellations,SUM(CAST(amount_paid AS REAL)) total_paid,MAX(appointment_date) last_visit FROM appointments WHERE phone=?",
    )
    .bind(phone)
    .first();
  return Response.json({ summary, history: rows.results || [] });
}
