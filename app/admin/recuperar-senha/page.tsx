"use client";
import { FormEvent, useState } from "react";
import Link from "next/link";
export default function RecoverPage() {
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const username = String(new FormData(event.currentTarget).get("username") ?? ""); const response = await fetch("/api/admin/recover", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ username }) }); const data = await response.json(); setMessage(data.message); }
  return <main className="admin-login-shell"><form className="admin-login-card" onSubmit={submit}><div className="brand-mark">BB</div><p className="eyebrow">Recuperar acesso</p><h1>Esqueci minha senha</h1><p>Informe seu usuário. O link será enviado ao e-mail protegido da conta.</p><input name="username" autoComplete="username" placeholder="Usuário" required />{message && <p className="admin-notice">{message}</p>}<button>Enviar instruções</button><Link href="/admin/login">Voltar ao login</Link></form></main>;
}
