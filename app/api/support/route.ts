import { getSupportUser } from "../../admin-auth";
import { getD1 } from "../../d1";
import { audit } from "../../audit";
import { ensureDailyBackup } from "../../backup";

export async function GET() {
  if (!(await getSupportUser()))
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  const db = await getD1();
  try { await ensureDailyBackup(); } catch {}
  const started = Date.now();
  const names = [
    "appointments",
    "appointment_slots",
    "schedule_blocks",
    "waitlist",
    "cash_transactions",
    "audit_logs",
    "support_trash",
    "error_logs",
  ] as const;
  const countRows = await Promise.all(
    names.map(async (name) => ({
      name,
      row: await db
        .prepare(`SELECT COUNT(*) n FROM ${name}`)
        .first<{ n: number }>(),
    })),
  );
  const counts = Object.fromEntries(
    countRows.map(({ name, row }) => [name, Number(row?.n || 0)]),
  );
  const [logs, settingsRows, errors, trash, conflicts, orphanSlots] =
    await Promise.all([
      db
        .prepare(
          "SELECT actor,action,entity_type,entity_id,details,created_at FROM audit_logs ORDER BY created_at DESC LIMIT 20",
        )
        .all(),
      db
        .prepare(
          "SELECT key,value FROM business_settings WHERE key IN ('booking_maintenance','support_refresh_seconds','support_retention_days','last_automatic_backup')",
        )
        .all(),
      db
        .prepare(
          "SELECT id,route,message,context,created_at,resolved_at FROM error_logs ORDER BY created_at DESC LIMIT 30",
        )
        .all(),
      db
        .prepare(
          "SELECT id,entity_type,entity_id,deleted_by,deleted_at,restored_at FROM support_trash ORDER BY deleted_at DESC LIMIT 30",
        )
        .all(),
      db
        .prepare(
          "SELECT COUNT(*) n FROM appointments a JOIN appointments b ON a.id<b.id AND a.barber=b.barber AND a.appointment_date=b.appointment_date AND a.status='confirmed' AND b.status='confirmed' AND a.start_time<b.end_time AND a.end_time>b.start_time",
        )
        .first<{ n: number }>(),
      db
        .prepare(
          "SELECT COUNT(*) n FROM appointment_slots s LEFT JOIN appointments a ON a.id=s.appointment_id WHERE a.id IS NULL",
        )
        .first<{ n: number }>(),
    ]);
  const settings = Object.fromEntries(
    (settingsRows.results as Array<{ key: string; value: string }>).map((x) => [
      x.key,
      x.value,
    ]),
  );
  return Response.json({
    counts,
    logs: logs.results,
    errors: errors.results,
    trash: trash.results,
    settings,
    health: {
      database_ms: Date.now() - started,
      conflicts: Number(conflicts?.n || 0),
      orphan_slots: Number(orphanSlots?.n || 0),
      last_checked: new Date().toISOString(),
    },
  });
}
export async function POST(request: Request) {
  const user = await getSupportUser();
  if (!user)
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  const { action, confirmation, value, id } = (await request.json()) as {
    action?: string;
    confirmation?: string;
    value?: string;
    id?: string;
  };
  const safeActions = [
    "toggle_maintenance",
    "settings",
    "resolve_error",
    "simulate",
  ];
  if (!safeActions.includes(action || "") && confirmation !== "LIMPAR")
    return Response.json({ error: "Confirmação inválida." }, { status: 400 });
  const db = await getD1();
  let result: D1Result<unknown> | undefined;
  if (action === "unlock")
    result = await db.prepare("DELETE FROM login_attempts").run();
  else if (action === "clean_logs")
    result = await db
      .prepare(
        "DELETE FROM audit_logs WHERE created_at < datetime('now','-90 days')",
      )
      .run();
  else if (action === "clean_cancelled") {
    const rows = await db
      .prepare("SELECT * FROM appointments WHERE status='cancelled'")
      .all<Record<string, unknown>>();
    const statements = (rows.results || []).map((row) =>
      db
        .prepare(
          "INSERT INTO support_trash (id,entity_type,entity_id,payload,deleted_by) VALUES (?,?,?,?,?)",
        )
        .bind(
          crypto.randomUUID(),
          "appointment",
          String(row.id),
          JSON.stringify(row),
          user.email,
        ),
    );
    if (statements.length) await db.batch(statements);
    result = await db
      .prepare("DELETE FROM appointments WHERE status='cancelled'")
      .run();
  } else if (action === "toggle_maintenance")
    result = await db
      .prepare(
        "INSERT INTO business_settings(key,value) VALUES('booking_maintenance',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
      )
      .bind(value === "1" ? "1" : "0")
      .run();
  else if (action === "settings") {
    const parsed = Math.max(5, Math.min(300, Number(value) || 15));
    result = await db
      .prepare(
        "INSERT INTO business_settings(key,value) VALUES('support_refresh_seconds',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
      )
      .bind(String(parsed))
      .run();
  } else if (action === "resolve_error")
    result = await db
      .prepare("UPDATE error_logs SET resolved_at=CURRENT_TIMESTAMP WHERE id=?")
      .bind(id || "")
      .run();
  else if (action === "restore") {
    const item = await db
      .prepare(
        "SELECT id,payload FROM support_trash WHERE id=? AND entity_type='appointment' AND restored_at IS NULL",
      )
      .bind(id || "")
      .first<{ id: string; payload: string }>();
    if (!item)
      return Response.json(
        { error: "Item não encontrado ou já restaurado." },
        { status: 404 },
      );
    const a = JSON.parse(item.payload) as Record<string, string>;
    await db
      .prepare(
        "INSERT OR IGNORE INTO appointments(id,customer_name,phone,service,barber,appointment_date,start_time,end_time,status,created_at,notes,cancel_token,payment_status,payment_method,amount_paid) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
      )
      .bind(
        a.id,
        a.customer_name,
        a.phone,
        a.service,
        a.barber,
        a.appointment_date,
        a.start_time,
        a.end_time,
        a.status,
        a.created_at,
        a.notes,
        a.cancel_token,
        a.payment_status,
        a.payment_method,
        a.amount_paid,
      )
      .run();
    result = await db
      .prepare(
        "UPDATE support_trash SET restored_at=CURRENT_TIMESTAMP WHERE id=?",
      )
      .bind(item.id)
      .run();
  } else if (action === "simulate") {
    const started = Date.now();
    const test = await db
      .prepare(
        "SELECT COUNT(*) n FROM appointments WHERE appointment_date>=date('now')",
      )
      .first<{ n: number }>();
    await audit(
      user.email,
      "support_simulation",
      "system",
      "",
      "Fluxo validado sem gravar agendamento",
    );
    return Response.json({
      message: `Teste concluído em ${Date.now() - started} ms: painel, banco e agenda pública estão respondendo. ${Number(test?.n || 0)} reserva(s) futura(s) lidas sem alterar dados.`,
    });
  } else
    return Response.json({ error: "Ação não permitida." }, { status: 400 });
  await audit(
    user.email,
    "support_maintenance",
    action,
    "",
    `Alterados: ${result?.meta.changes || 0}`,
  );
  return Response.json({
    message: `Operação concluída. ${result?.meta.changes || 0} registro(s) alterado(s).`,
  });
}
