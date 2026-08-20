"use client";
import { FormEvent, useState } from "react";
import Link from "next/link";
export default function LoginForm() {
  const [error, setError] = useState(""),
    [loading, setLoading] = useState(false),
    [factorId, setFactorId] = useState(""),
    [mfaRole, setMfaRole] = useState<"admin" | "support">("admin");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(
        Object.fromEntries(new FormData(event.currentTarget)),
      ),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? "Não foi possível entrar.");
      setLoading(false);
      return;
    }
    if (data.mfaRequired) {
      setFactorId(data.factorId);
      setMfaRole(data.role === "support" ? "support" : "admin");
      setLoading(false);
      return;
    }
    window.location.href = data.destination || "/admin";
  }
  async function verifyMfa(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError("");
    const code = String(new FormData(event.currentTarget).get("code") ?? "");
    const response = await fetch("/api/admin/mfa/verify", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ factorId, code, role: mfaRole }) });
    const data = await response.json();
    if (!response.ok) { setError(data.error ?? "Código incorreto."); setLoading(false); return; }
    window.location.href = data.destination || "/admin";
  }
  if (factorId) return <form className="admin-login-card" onSubmit={verifyMfa}><div className="brand-mark">BB</div><p className="eyebrow">Verificação em duas etapas</p><h1>Digite o código</h1><p>Abra seu aplicativo autenticador e informe o código de 6 números.</p><input name="code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoFocus required placeholder="000000" />{error && <p className="admin-error">{error}</p>}<button disabled={loading}>{loading ? "Verificando…" : "Confirmar acesso"}</button><button type="button" onClick={() => setFactorId("")}>Voltar</button></form>;
  return (
    <form className="admin-login-card" onSubmit={submit}>
      <div className="brand-mark">BB</div>
      <p className="eyebrow">Área administrativa</p>
      <h1>Entrar no painel</h1>
      <p>Use o acesso fornecido pela Barbearia Bittencourt.</p>
      <label htmlFor="username">Usuário</label>
      <input
        id="username"
        name="username"
        type="text"
        autoComplete="username"
        autoCapitalize="none"
        required
      />
      <label htmlFor="password">Senha</label>
      <input
        id="password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
      />
      {error && <p className="admin-error">{error}</p>}
      <button disabled={loading}>{loading ? "Entrando…" : "Entrar"}</button>
      <Link href="/admin/recuperar-senha">Esqueci minha senha</Link>
      <Link href="/">Voltar para o site</Link>
    </form>
  );
}
