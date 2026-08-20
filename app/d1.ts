export async function getD1(): Promise<D1Database> {
  const { env } = await import("cloudflare:workers");
  const database = (env as unknown as { DB?: D1Database }).DB;
  if (!database) throw new Error("Banco de dados indisponível.");
  return database;
}
