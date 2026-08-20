import { getD1 } from "./d1";

export async function audit(
  actor: string,
  action: string,
  entityType: string,
  entityId = "",
  details = "",
) {
  const database = await getD1();
  await database
    .prepare(
      "INSERT INTO audit_logs (id, actor, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?, ?)",
    )
    .bind(
      crypto.randomUUID(),
      actor,
      action,
      entityType,
      entityId,
      details.slice(0, 300),
    )
    .run();
}
