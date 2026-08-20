"use client";
import { FormEvent, useState } from "react";
import Link from "next/link";
export default function ResetPage() {
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const token = new URLSearchParams(location.hash.slice(1)).get("access_token") ?? ""; if (!token) return setMessage("Link inválido ou expirado."); const form = new FormData(event.currentTarget), password = String(form.get("password") ?? ""), confirmation = String(form.get("confirmation") ?? ""); if (password !== confirmation) return setMessage("As senhas não são iguais."); const response = await fetch("/api/admin/recover/confirm", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token, password }) }); const data = await response.json(); setMessage(response.ok ? "Senha alterada. Você já pode entrar." : data.error); }
  return <main className="admin-login-shell"><form className="admin-login-card" onSubmit={submit}><div className="brand-mark">BB</div><p className="eyebrow">Novo acesso</p><h1>Redefinir senha</h1><input name="password" type="password" placeholder="Nova senha forte" required /><input name="confirmation" type="password" placeholder="Repita a senha" required />{message && <p className="admin-notice">{message}</p>}<button>Salvar nova senha</button><Link href="/admin/login">Voltar ao login</Link></form></main>;
}
