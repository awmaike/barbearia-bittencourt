"use client";
import { FormEvent, useEffect, useState } from "react";
type Item = { id: string; title: string };
export default function GalleryManager() {
  const [items, setItems] = useState<Item[]>([]), [message, setMessage] = useState(""), [busy, setBusy] = useState(false);
  const load = () => fetch("/api/gallery").then((r) => r.json()).then((d) => setItems(d.items ?? []));
  useEffect(() => { void load(); }, []);
  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("Enviando…");
    const response = await fetch("/api/gallery", { method: "POST", body: new FormData(event.currentTarget) });
    const data = await response.json(); setMessage(response.ok ? "Foto adicionada à galeria." : data.error); setBusy(false);
    if (response.ok) { event.currentTarget.reset(); void load(); }
  }
  async function remove(id: string) { await fetch("/api/gallery", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ id }) }); void load(); }
  return <section className="admin-box area-sistema"><h2>Galeria do site</h2><p>Envie fotos reais dos cortes. JPG, PNG ou WebP, até 5 MB.</p><form className="inline-search" onSubmit={upload}><input name="title" placeholder="Descrição do corte" required /><input name="file" type="file" accept="image/jpeg,image/png,image/webp" required /><button disabled={busy}>{busy ? "Enviando…" : "Adicionar foto"}</button></form>{message && <p className="admin-notice">{message}</p>}<div className="gallery-admin-grid">{items.map((item) => <article key={item.id}><img src={`/api/gallery/${item.id}`} alt={item.title} /><span>{item.title}</span><button onClick={() => void remove(item.id)}>Remover</button></article>)}</div></section>;
}
