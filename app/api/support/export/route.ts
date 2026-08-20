import { getSupportUser } from "../../../admin-auth";
import { getD1 } from "../../../d1";
const csv = (v: unknown) => `"${String(v ?? "").replaceAll('"', '""')}"`;
export async function GET() {
  if (!(await getSupportUser()))
    return new Response("Não autorizado.", { status: 401 });
  const db = await getD1(),
    rows = await db
      .prepare(
        "SELECT * FROM appointments ORDER BY appointment_date,start_time",
      )
      .all();
  const records = (rows.results || []) as Array<Record<string, unknown>>;
  const keys = records[0] ? Object.keys(records[0]) : [];
  const body = [
    keys.map(csv).join(","),
    ...records.map((r) => keys.map((k) => csv(r[k])).join(",")),
  ].join("\n");
  return new Response(body, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": "attachment; filename=backup-agendamentos.csv",
    },
  });
}
