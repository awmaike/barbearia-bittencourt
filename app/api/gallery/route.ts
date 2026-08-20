import { getAdminUser } from "../../admin-auth";
import { getD1 } from "../../d1";
import { getR2 } from "../../r2";

type GalleryItem = { id: string; title: string; key: string; createdAt: string };

async function readItems() {
  const db = await getD1();
  const row = await db.prepare("SELECT value FROM business_settings WHERE key='gallery_items'").first<{ value: string }>();
  try { return JSON.parse(row?.value ?? "[]") as GalleryItem[]; } catch { return []; }
}

async function saveItems(items: GalleryItem[]) {
  const db = await getD1();
  await db.prepare("INSERT INTO business_settings(key,value) VALUES('gallery_items',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").bind(JSON.stringify(items)).run();
}

export async function GET() {
  return Response.json({ items: await readItems() });
}

export async function POST(request: Request) {
  if (!(await getAdminUser())) return Response.json({ error: "Não autorizado." }, { status: 401 });
  const form = await request.formData();
  const file = form.get("file");
  const title = String(form.get("title") ?? "Trabalho realizado").trim().slice(0, 80);
  if (!(file instanceof File) || !file.type.startsWith("image/") || file.size > 5_000_000)
    return Response.json({ error: "Envie uma imagem de até 5 MB." }, { status: 400 });
  const id = crypto.randomUUID();
  const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const key = `gallery/${id}.${extension}`;
  await (await getR2()).put(key, file.stream(), { httpMetadata: { contentType: file.type, cacheControl: "public, max-age=86400" } });
  const items = await readItems();
  items.unshift({ id, title: title || "Trabalho realizado", key, createdAt: new Date().toISOString() });
  await saveItems(items.slice(0, 24));
  return Response.json({ ok: true });
}

export async function DELETE(request: Request) {
  if (!(await getAdminUser())) return Response.json({ error: "Não autorizado." }, { status: 401 });
  const id = String(((await request.json()) as { id?: string }).id ?? "");
  const items = await readItems();
  const item = items.find((entry) => entry.id === id);
  if (item) await (await getR2()).delete(item.key);
  await saveItems(items.filter((entry) => entry.id !== id));
  return Response.json({ ok: true });
}
