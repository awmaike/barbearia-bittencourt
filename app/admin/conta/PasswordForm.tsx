"use client";
import { FormEvent, useState } from "react";

export default function PasswordForm() {
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form),
      password = String(data.get("password") ?? ""),
      confirmation = String(data.get("confirmation") ?? "");
    if (password !== confirmation)
      return setMessage("As senhas não são iguais.");
    const response = await fetch("/api/admin/password", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const body = await response.json();
    setMessage(response.ok ? "Senha alterada com sucesso." : body.error);
    if (response.ok) form.reset();
  }
  return (
    <form className="admin-box account-form" onSubmit={submit}>
      <h2>Alterar senha</h2>
      <p>
        Use pelo menos 10 caracteres, incluindo maiúscula, minúscula, número e
        símbolo.
      </p>
      <input
        name="password"
        type="password"
        autoComplete="new-password"
        placeholder="Nova senha"
        required
      />
      <input
        name="confirmation"
        type="password"
        autoComplete="new-password"
        placeholder="Repita a nova senha"
        required
      />
      <button>Salvar nova senha</button>
      {message && <p className="admin-notice">{message}</p>}
    </form>
  );
}
