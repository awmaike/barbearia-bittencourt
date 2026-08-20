import { getAdminUser } from "../../../admin-auth";
import { audit } from "../../../audit";
import { getD1 } from "../../../d1";

async function authorized() {
  return Boolean(await getAdminUser());
}

export async function GET(request: Request) {
  if (!(await authorized()))
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  const date = new URL(request.url).searchParams.get("date") ?? "";
  const database = await getD1();
  const rows = await database
    .prepare(
      "SELECT * FROM cash_transactions WHERE transaction_date = ? ORDER BY created_at DESC",
    )
    .bind(date)
    .all();
  return Response.json({ transactions: rows.results ?? [] });
}

export async function POST(request: Request) {
  const admin = await getAdminUser();
  if (!admin)
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  const body = (await request.json()) as Record<string, unknown>;
  const appointmentId = String(body.appointmentId ?? "").trim(),
    type = String(body.type ?? "income"),
    description = String(body.description ?? "")
      .trim()
      .slice(0, 120),
    method = String(body.method ?? "pix"),
    date = String(body.date ?? "");
  const amount = Number(body.amount);
  if (
    !["income", "expense"].includes(type) ||
    !description ||
    !Number.isFinite(amount) ||
    amount <= 0 ||
    !["pix", "dinheiro", "cartao"].includes(method) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date)
  )
    return Response.json(
      { error: "Dados do caixa inválidos." },
      { status: 400 },
    );
  const database = await getD1();
  if (appointmentId) {
    const appointment = await database
      .prepare(
        "SELECT payment_status, amount_paid FROM appointments WHERE id = ?",
      )
      .bind(appointmentId)
      .first<{ payment_status: string; amount_paid: string }>();
    if (!appointment)
      return Response.json(
        { error: "Agendamento não encontrado." },
        { status: 404 },
      );
    if (type === "income" && appointment.payment_status === "deposit_paid")
      return Response.json(
        { error: "O sinal deste cliente já foi registrado." },
        { status: 409 },
      );
    if (type === "expense" && appointment.payment_status !== "deposit_paid")
      return Response.json(
        { error: "Este agendamento não possui sinal para reembolsar." },
        { status: 409 },
      );
  }
  const statements = [
    database
      .prepare(
        "INSERT INTO cash_transactions (id, appointment_id, type, description, amount, method, transaction_date) VALUES (?, ?, ?, ?, ?, ?, ?)",
      )
      .bind(
        crypto.randomUUID(),
        appointmentId || null,
        type,
        description,
        amount.toFixed(2),
        method,
        date,
      ),
  ];
  if (appointmentId && type === "income")
    statements.push(
      database
        .prepare(
          "UPDATE appointments SET amount_paid = CAST(CAST(amount_paid AS REAL) + ? AS TEXT), payment_status = CASE WHEN CAST(amount_paid AS REAL) + ? >= 10 THEN 'deposit_paid' ELSE payment_status END, payment_method = ? WHERE id = ?",
        )
        .bind(amount.toFixed(2), amount.toFixed(2), method, appointmentId),
    );
  if (appointmentId && type === "expense")
    statements.push(
      database
        .prepare(
          "UPDATE appointments SET amount_paid = '0', payment_status = 'refunded' WHERE id = ?",
        )
        .bind(appointmentId),
    );
  await database.batch(statements);
  await audit(
    admin.email,
    type === "income" ? "cash_income" : "cash_expense",
    "cash",
    appointmentId,
    `${description} · R$ ${amount.toFixed(2)}`,
  );
  return Response.json({ ok: true }, { status: 201 });
}
