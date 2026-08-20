import { getAdminUser } from "../../../admin-auth";
import { getD1 } from "../../../d1";

function csv(value: unknown) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}
export async function GET(request: Request) {
  if (!(await getAdminUser()))
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  const url = new URL(request.url),
    from = url.searchParams.get("from") ?? "0000-01-01",
    to = url.searchParams.get("to") ?? "9999-12-31";
  const database = await getD1();
  const rows = await database
    .prepare(
      "SELECT customer_name, phone, service, barber, appointment_date, start_time, end_time, status, notes FROM appointments WHERE appointment_date BETWEEN ? AND ? ORDER BY appointment_date, start_time",
    )
    .bind(from, to)
    .all<Record<string, unknown>>();
  const headers = [
    "Cliente",
    "Telefone",
    "Serviço",
    "Barbeiro",
    "Data",
    "Início",
    "Fim",
    "Status",
    "Observações",
  ];
  const body = [
    headers.map(csv).join(";"),
    ...(rows.results ?? []).map((row) =>
      [
        row.customer_name,
        row.phone,
        row.service,
        row.barber,
        row.appointment_date,
        row.start_time,
        row.end_time,
        row.status,
        row.notes,
      ]
        .map(csv)
        .join(";"),
    ),
  ].join("\n");
  return new Response(`\uFEFF${body}`, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="agenda-bittencourt-${from}-${to}.csv"`,
    },
  });
}
