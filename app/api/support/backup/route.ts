import { getSupportUser } from "../../../admin-auth";
import { getD1 } from "../../../d1";
export async function GET() {
  if (!(await getSupportUser()))
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  const db = await getD1();
  const tables = [
    "appointments",
    "appointment_slots",
    "barber_hours",
    "schedule_blocks",
    "business_settings",
    "waitlist",
    "cash_transactions",
    "audit_logs",
  ];
  const backup: Record<string, unknown> = {
    version: 1,
    created_at: new Date().toISOString(),
  };
  for (const table of tables) {
    const r = await db.prepare(`SELECT * FROM ${table}`).all();
    backup[table] = r.results || [];
  }
  return new Response(JSON.stringify(backup, null, 2), {
    headers: {
      "content-type": "application/json",
      "content-disposition":
        "attachment; filename=backup-completo-bittencourt.json",
    },
  });
}
