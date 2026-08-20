import { getAdminUser } from "../../../admin-auth";
import { getD1 } from "../../../d1";

export async function GET(request: Request) {
  if (!(await getAdminUser()))
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  const q = `%${new URL(request.url).searchParams.get("q") ?? ""}%`;
  const database = await getD1();
  const rows = await database
    .prepare(
      "SELECT customer_name, phone, COUNT(*) total_visits, MAX(appointment_date) last_visit FROM appointments WHERE customer_name LIKE ? OR phone LIKE ? GROUP BY customer_name, phone ORDER BY last_visit DESC LIMIT 100",
    )
    .bind(q, q)
    .all();
  return Response.json({ customers: rows.results ?? [] });
}
