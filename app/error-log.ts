import { getD1 } from "./d1";
export async function logError(route: string, error: unknown, context = "") {
  try {
    const db = await getD1();
    const message = error instanceof Error ? error.message : String(error);
    await db
      .prepare(
        "INSERT INTO error_logs (id,route,message,context) VALUES (?,?,?,?)",
      )
      .bind(
        crypto.randomUUID(),
        route,
        message.slice(0, 300),
        context.slice(0, 500),
      )
      .run();
  } catch {}
}
