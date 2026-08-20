"use client";
import { useEffect, useState } from "react";

type Item = { id: string; title: string };
export default function Gallery() {
  const [items, setItems] = useState<Item[]>([]);
  useEffect(() => { void fetch("/api/gallery").then((r) => r.json()).then((d) => setItems(d.items ?? [])); }, []);
  if (!items.length) return null;
  return (
    <section className="gallery-section" id="galeria">
      <p className="eyebrow">Nosso trabalho</p><h2>Cortes que falam por si</h2>
      <div className="gallery-grid">{items.map((item) => <figure key={item.id}><img src={`/api/gallery/${item.id}`} alt={item.title} loading="lazy" /><figcaption>{item.title}</figcaption></figure>)}</div>
    </section>
  );
}
