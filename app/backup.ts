import { getD1 } from "./d1";
import { getR2 } from "./r2";

const tables = ["appointments", "appointment_slots", "barber_hours", "schedule_blocks", "business_settings", "waitlist", "cash_transactions", "audit_logs"];

export async function ensureDailyBackup() {
  const db = await getD1();
  const date = new Date().toISOString().slice(0, 10);
  const current = await db.prepare("SELECT value FROM business_settings WHERE key='last_automatic_backup'").first<{ value: string }>();
  if (current?.value?.startsWith(date)) return current.value;
  const backup: Record<string, unknown> = { version: 1, created_at: new Date().toISOString() };
  for (const table of tables) backup[table] = (await db.prepare(`SELECT * FROM ${table}`).all()).results ?? [];
  const createdAt = String(backup.created_at);
  await (await getR2()).put(`backups/${date}.json`, JSON.stringify(backup), { httpMetadata: { contentType: "application/json" } });
  await db.prepare("INSERT INTO business_settings(key,value) VALUES('last_automatic_backup',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").bind(createdAt).run();
  return createdAt;
}
