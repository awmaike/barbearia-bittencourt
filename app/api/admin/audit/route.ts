import { getAdminUser } from "../../../admin-auth";
import { getD1 } from "../../../d1";
export async function GET() {
  if (!(await getAdminUser()))
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  const database = await getD1();
  const rows = await database
    .prepare("SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100")
    .all();
  return Response.json({ logs: rows.results ?? [] });
}
