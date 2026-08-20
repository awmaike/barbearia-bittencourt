"use client";
/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */

import { FormEvent, useEffect, useState } from "react";
type Transaction = {
  id: string;
  type: string;
  description: string;
  amount: string;
  method: string;
};

export default function CashManager({ date }: { date: string }) {
  const [items, setItems] = useState<Transaction[]>([]),
    [message, setMessage] = useState("");
  async function load() {
    const data = await fetch(`/api/admin/cash?date=${date}`).then((response) =>
      response.json(),
    );
    setItems(data.transactions ?? []);
  }
  useEffect(() => {
    void load();
  }, [date]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form));
    const response = await fetch("/api/admin/cash", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...values, date }),
    });
    const data = await response.json();
    setMessage(response.ok ? "Movimentação registrada." : data.error);
    if (response.ok) {
      form.reset();
      void load();
    }
  }
  const income = items
      .filter((item) => item.type === "income")
      .reduce((sum, item) => sum + Number(item.amount), 0),
    expense = items
      .filter((item) => item.type === "expense")
      .reduce((sum, item) => sum + Number(item.amount), 0);
  return (
    <section className="admin-box">
      <h2>Caixa do dia</h2>
      <div className="report-grid">
        <div>
          <strong>R$ {income.toFixed(2)}</strong>
          <span>Entradas</span>
        </div>
        <div>
          <strong>R$ {expense.toFixed(2)}</strong>
          <span>Saídas</span>
        </div>
        <div>
          <strong>R$ {(income - expense).toFixed(2)}</strong>
          <span>Saldo</span>
        </div>
      </div>
      <form className="admin-form-grid" onSubmit={submit}>
        <select name="type">
          <option value="income">Entrada</option>
          <option value="expense">Saída</option>
        </select>
        <input name="description" placeholder="Descrição" required />
        <input
          name="amount"
          type="number"
          min="0.01"
          step="0.01"
          placeholder="Valor"
          required
        />
        <select name="method">
          <option value="pix">Pix</option>
          <option value="dinheiro">Dinheiro</option>
          <option value="cartao">Cartão</option>
        </select>
        <button>Registrar</button>
      </form>
      {message && <p className="admin-notice">{message}</p>}
      <div className="customer-list">
        {items.map((item) => (
          <span key={item.id}>
            <strong>
              {item.type === "income" ? "+" : "−"} R${" "}
              {Number(item.amount).toFixed(2)}
            </strong>{" "}
            · {item.description} · {item.method}
          </span>
        ))}
      </div>
    </section>
  );
}
