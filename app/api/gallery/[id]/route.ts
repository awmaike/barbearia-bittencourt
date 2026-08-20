import { getD1 } from "../../../d1";
import { getR2 } from "../../../r2";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const db = await getD1();
  const row = await db.prepare("SELECT value FROM business_settings WHERE key='gallery_items'").first<{ value: string }>();
  let items: Array<{ id: string; key: string }> = [];
  try { items = JSON.parse(row?.value ?? "[]"); } catch {}
  const item = items.find((entry) => entry.id === id);
  if (!item) return new Response("Não encontrado", { status: 404 });
  const object = await (await getR2()).get(item.key);
  if (!object) return new Response("Não encontrado", { status: 404 });
  return new Response(object.body, { headers: { "content-type": object.httpMetadata?.contentType ?? "image/jpeg", "cache-control": "public, max-age=86400" } });
}
