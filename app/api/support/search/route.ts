import { getSupportUser } from "../../../admin-auth";
import { getD1 } from "../../../d1";
export async function GET(request: Request) {
  if (!(await getSupportUser()))
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  const p = new URL(request.url).searchParams,
    q = `%${(p.get("q") || "").slice(0, 80)}%`,
    status = p.get("status") || "",
    date = p.get("date") || "",
    barber = p.get("barber") || "",
    service = p.get("service") || "",
    payment = p.get("payment") || "";
  const db = await getD1();
  const rows = await db
    .prepare(
      "SELECT id,customer_name,phone,service,appointment_date,start_time,end_time,barber,status,payment_status,amount_paid,created_at FROM appointments WHERE (customer_name LIKE ? OR phone LIKE ?) AND (?='' OR status=?) AND (?='' OR appointment_date=?) AND (?='' OR barber=?) AND (?='' OR service LIKE '%'||?||'%') AND (?='' OR payment_status=?) ORDER BY appointment_date DESC,start_time DESC LIMIT 200",
    )
    .bind(
      q,
      q,
      status,
      status,
      date,
      date,
      barber,
      barber,
      service,
      service,
      payment,
      payment,
    )
    .all();
  return Response.json({ results: rows.results || [] });
}
