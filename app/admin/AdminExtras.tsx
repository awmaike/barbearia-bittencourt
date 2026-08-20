"use client";
/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */

import { FormEvent, useEffect, useState } from "react";
import CashManager from "./CashManager";
import GalleryManager from "./GalleryManager";

type Appointment = {
  id: string;
  customer_name: string;
  phone: string;
  service: string;
  barber: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: string;
};
type Wait = {
  id: string;
  customer_name: string;
  phone: string;
  preferred_date: string;
  preferred_period: string;
  service: string;
  barber: string;
};
type Customer = {
  customer_name: string;
  phone: string;
  total_visits: number;
  last_visit: string;
};
type Audit = {
  id: string;
  actor: string;
  action: string;
  details: string;
  created_at: string;
};
type Report = {
  totalRevenue: number;
  previousRevenue: number;
  previousMonth: string;
  changePercent: number | null;
  cancellations: number;
  noShows: number;
  rows: Array<{
    barber: string;
    appointments: number;
    revenue: number;
    commissionRate: number;
    commissionValue: number;
  }>;
};
type RecurringExpense = { id: string; name: string; amount: number; dueDay: number };
function shiftDate(date: string, days: number) {
  const value = new Date(`${date}T12:00:00`);
  value.setDate(value.getDate() + days);
  return value.toISOString().slice(0, 10);
}

export default function AdminExtras({
  date,
  onChanged,
}: {
  date: string;
  onChanged: () => void;
}) {
  const [week, setWeek] = useState<Appointment[]>([]),
    [waitlist, setWaitlist] = useState<Wait[]>([]),
    [customers, setCustomers] = useState<Customer[]>([]),
    [logs, setLogs] = useState<Audit[]>([]);
  const [message, setMessage] = useState(""),
    [customerQuery, setCustomerQuery] = useState(""),
    [month, setMonth] = useState(date.slice(0, 7));
  const [commissionPedrinho, setCommissionPedrinho] = useState("0"),
    [commissionTreco, setCommissionTreco] = useState("0");
  const [report, setReport] = useState<Report | null>(null);
  const [expenses, setExpenses] = useState<RecurringExpense[]>([]);
  const [expenseName, setExpenseName] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [activeArea, setActiveArea] = useState<
    "operacao" | "clientes" | "financeiro" | "sistema"
  >("operacao");

  async function loadWeek(anchor = date) {
    const start = shiftDate(
      anchor,
      -(new Date(`${anchor}T12:00:00`).getDay() || 7) + 1,
    );
    const dates = Array.from({ length: 6 }, (_, index) =>
      shiftDate(start, index),
    );
    const data = await Promise.all(
      dates.map((item) =>
        fetch(`/api/admin/appointments?date=${item}`).then((response) =>
          response.json(),
        ),
      ),
    );
    setWeek(data.flatMap((item) => item.appointments ?? []));
  }
  async function loadWaitlist() {
    const data = await fetch("/api/admin/waitlist").then((response) =>
      response.json(),
    );
    setWaitlist(data.waitlist ?? []);
  }
  async function loadSettings() {
    const data = await fetch("/api/admin/settings").then((response) =>
      response.json(),
    );
    const map = Object.fromEntries(
      (data.settings ?? []).map((item: { key: string; value: string }) => [
        item.key,
        item.value,
      ]),
    );
    setCommissionPedrinho(map.commission_pedrinho ?? "0");
    setCommissionTreco(map.commission_treco ?? "0");
    try {
      setExpenses(JSON.parse(map.recurring_expenses ?? "[]"));
    } catch {
      setExpenses([]);
    }
  }
  useEffect(() => {
    void Promise.all([loadWeek(), loadWaitlist()]);
  }, []);

  useEffect(() => {
    if (activeArea === "financeiro") void loadSettings();
    if (activeArea === "sistema")
      void fetch("/api/admin/audit")
        .then((response) => response.json())
        .then((data) => setLogs(data.logs ?? []));
  }, [activeArea]);

  async function manual(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/appointments", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(Object.fromEntries(form)),
    });
    const data = await response.json();
    setMessage(response.ok ? "Agendamento criado." : data.error);
    if (response.ok) {
      event.currentTarget.reset();
      onChanged();
      void loadWeek();
    }
  }
  async function addWait(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/waitlist", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(Object.fromEntries(form)),
    });
    const data = await response.json();
    setMessage(
      response.ok ? "Cliente adicionado à lista de espera." : data.error,
    );
    if (response.ok) {
      event.currentTarget.reset();
      void loadWaitlist();
    }
  }
  async function contacted(id: string) {
    await fetch("/api/admin/waitlist", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id }),
    });
    void loadWaitlist();
  }
  async function searchCustomers() {
    const data = await fetch(
      `/api/admin/customers?q=${encodeURIComponent(customerQuery)}`,
    ).then((response) => response.json());
    setCustomers(data.customers ?? []);
  }
  async function saveSetting(key: string, value: string) {
    await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ type: "setting", key, value }),
    });
    setMessage("Configuração salva.");
  }
  async function blockDay() {
    for (const barber of ["Pedrinho", "Treco"])
      await fetch("/api/admin/blocks", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          barber,
          date,
          start: "08:00",
          end: "18:00",
          reason: "Dia bloqueado",
        }),
      });
    setMessage("Dia bloqueado para os dois barbeiros.");
    onChanged();
  }
  async function loadReport() {
    const data = await fetch(`/api/admin/report?month=${month}`).then(
      (response) => response.json(),
    );
    setReport(data);
  }
  async function saveExpenses(next: RecurringExpense[]) {
    setExpenses(next);
    await saveSetting("recurring_expenses", JSON.stringify(next));
  }
  async function addExpense(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const amount = Number(expenseAmount.replace(",", "."));
    if (!expenseName.trim() || amount <= 0) return;
    await saveExpenses([
      ...expenses,
      { id: crypto.randomUUID(), name: expenseName.trim(), amount, dueDay: 1 },
    ]);
    setExpenseName("");
    setExpenseAmount("");
  }

  const monthStart = `${month}-01`,
    monthEnd = `${month}-31`;
  return (
    <div className={`admin-extras admin-area-${activeArea}`}>
      {message && <p className="admin-notice">{message}</p>}
      <div className="admin-tools-heading">
        <div>
          <p className="eyebrow">Ferramentas</p>
          <h2>Gestão da barbearia</h2>
          <p>Escolha uma área para ver apenas o que você precisa.</p>
        </div>
      </div>
      <nav className="admin-area-tabs" aria-label="Áreas administrativas">
        <button
          className={activeArea === "operacao" ? "active" : ""}
          onClick={() => setActiveArea("operacao")}
        >
          Operação
        </button>
        <button
          className={activeArea === "clientes" ? "active" : ""}
          onClick={() => setActiveArea("clientes")}
        >
          Clientes
        </button>
        <button
          className={activeArea === "financeiro" ? "active" : ""}
          onClick={() => setActiveArea("financeiro")}
        >
          Financeiro
        </button>
        <button
          className={activeArea === "sistema" ? "active" : ""}
          onClick={() => setActiveArea("sistema")}
        >
          Sistema
        </button>
      </nav>
      {activeArea === "financeiro" && (
        <div className="admin-area-panel area-financeiro">
          <CashManager date={date} />
        </div>
      )}
      <section className="admin-box area-operacao">
        <h2>Ações rápidas</h2>
        <div className="quick-actions">
          <button onClick={blockDay}>Bloquear o dia inteiro</button>
          <a href="/admin/tv" target="_blank">
            Abrir modo TV
          </a>
          <a href={`/api/admin/export?from=${monthStart}&to=${monthEnd}`}>
            Exportar/backup do mês
          </a>
          <a href={`/api/admin/export?from=${date}&to=${date}`}>
            Backup do dia
          </a>
        </div>
      </section>
      <section className="admin-box area-operacao">
        <h2>Novo agendamento ou encaixe</h2>
        <form className="admin-form-grid" onSubmit={manual}>
          <input name="customerName" placeholder="Nome" required />
          <input name="phone" placeholder="WhatsApp" required />
          <select name="service">
            <option value="corte">Corte</option>
            <option value="barba">Barba</option>
            <option value="sobrancelha">Sobrancelha</option>
            <option value="combo">Corte + barba</option>
            <option value="corte_sobrancelha">Corte + sobrancelha</option>
            <option value="corte_barba_sobrancelha">Todos</option>
          </select>
          <select name="barber">
            <option>Pedrinho</option>
            <option>Treco</option>
          </select>
          <input name="date" type="date" defaultValue={date} required />
          <input name="start" type="time" step="300" required />
          <input name="notes" placeholder="Observações" />
          <label>
            <input name="force" type="checkbox" value="true" /> Encaixe fora dos
            15 min
          </label>
          <button>Criar agendamento</button>
        </form>
      </section>
      <section className="admin-box area-operacao">
        <div className="box-heading">
          <div>
            <h2>Visão semanal</h2>
            <p>Segunda a sábado</p>
          </div>
          <button onClick={() => void loadWeek(date)}>Atualizar</button>
        </div>
        <div className="week-grid">
          {Array.from({ length: 6 }, (_, index) => {
            const monday = shiftDate(
                date,
                -(new Date(`${date}T12:00:00`).getDay() || 7) + 1,
              ),
              day = shiftDate(monday, index);
            return (
              <div key={day}>
                <strong>{day.split("-").reverse().join("/")}</strong>
                {week
                  .filter(
                    (item) =>
                      item.appointment_date === day &&
                      item.status === "confirmed",
                  )
                  .map((item) => (
                    <span key={item.id}>
                      {item.start_time} · {item.barber}
                      <small>{item.customer_name}</small>
                    </span>
                  ))}
              </div>
            );
          })}
        </div>
      </section>
      <section className="admin-box area-clientes">
        <h2>Lista de espera</h2>
        <form className="admin-form-grid" onSubmit={addWait}>
          <input name="name" placeholder="Nome" required />
          <input name="phone" placeholder="WhatsApp" required />
          <input name="date" type="date" defaultValue={date} required />
          <input name="period" placeholder="Manhã, tarde ou horário" />
          <select name="service">
            <option value="corte">Corte</option>
            <option value="barba">Barba</option>
            <option value="sobrancelha">Sobrancelha</option>
            <option value="combo">Corte + barba</option>
          </select>
          <select name="barber">
            <option>Pedrinho</option>
            <option>Treco</option>
          </select>
          <button>Adicionar</button>
        </form>
        <div className="wait-list">
          {waitlist.map((item) => (
            <div key={item.id}>
              <strong>{item.customer_name}</strong>
              <span>
                {item.preferred_date.split("-").reverse().join("/")} ·{" "}
                {item.preferred_period} · {item.barber}
              </span>
              <a
                href={`https://wa.me/55${item.phone}`}
                target="_blank"
                rel="noreferrer"
              >
                WhatsApp
              </a>
              <button onClick={() => void contacted(item.id)}>Remover</button>
            </div>
          ))}
        </div>
      </section>
      <section className="admin-box area-clientes">
        <h2>Clientes e histórico</h2>
        <div className="inline-search">
          <input
            value={customerQuery}
            onChange={(event) => setCustomerQuery(event.target.value)}
            placeholder="Nome ou telefone"
          />
          <button onClick={searchCustomers}>Pesquisar</button>
        </div>
        <div className="customer-list">
          {customers.map((item) => (
            <span key={`${item.phone}-${item.customer_name}`}>
              <strong>{item.customer_name}</strong> · {item.phone} ·{" "}
              {item.total_visits} atendimento(s) · último em{" "}
              {item.last_visit?.split("-").reverse().join("/")}
            </span>
          ))}
        </div>
      </section>
      <section className="admin-box area-financeiro">
        <h2>Relatório, comissões e exportação</h2>
        <div className="settings-row">
          <input
            type="month"
            value={month}
            onChange={(event) => setMonth(event.target.value)}
          />
          <button onClick={loadReport}>Gerar relatório</button>
          <a href={`/api/admin/export?from=${monthStart}&to=${monthEnd}`}>
            Baixar Excel/CSV
          </a>
          <label>
            Comissão Pedrinho (%)
            <input
              type="number"
              min="0"
              max="100"
              value={commissionPedrinho}
              onChange={(event) => setCommissionPedrinho(event.target.value)}
              onBlur={() =>
                void saveSetting("commission_pedrinho", commissionPedrinho)
              }
            />
          </label>
          <label>
            Comissão Treco (%)
            <input
              type="number"
              min="0"
              max="100"
              value={commissionTreco}
              onChange={(event) => setCommissionTreco(event.target.value)}
              onBlur={() =>
                void saveSetting("commission_treco", commissionTreco)
              }
            />
          </label>
        </div>
        {report && (
          <div className="report-grid">
            <div>
              <strong>R$ {report.totalRevenue.toFixed(2)}</strong>
              <span>Faturamento</span>
            </div>
            <div>
              <strong>R$ {report.previousRevenue.toFixed(2)}</strong>
              <span>Mês anterior ({report.previousMonth})</span>
            </div>
            <div>
              <strong>
                {report.changePercent === null
                  ? "—"
                  : `${report.changePercent >= 0 ? "+" : ""}${report.changePercent.toFixed(1)}%`}
              </strong>
              <span>Variação mensal</span>
            </div>
            <div>
              <strong>{report.cancellations}</strong>
              <span>Cancelamentos</span>
            </div>
            <div>
              <strong>{report.noShows}</strong>
              <span>Faltas</span>
            </div>
            {report.rows.map((item) => (
              <div key={item.barber}>
                <strong>{item.barber}</strong>
                <span>
                  {item.appointments} atendimentos · R${" "}
                  {item.revenue.toFixed(2)} · comissão R${" "}
                  {item.commissionValue.toFixed(2)} ({item.commissionRate}%)
                </span>
              </div>
            ))}
          </div>
        )}
        <div className="box-heading finance-subheading">
          <div>
            <h3>Despesas recorrentes</h3>
            <p>Total mensal: R$ {expenses.reduce((sum, item) => sum + item.amount, 0).toFixed(2)}</p>
          </div>
        </div>
        <form className="inline-search" onSubmit={addExpense}>
          <input value={expenseName} onChange={(event) => setExpenseName(event.target.value)} placeholder="Ex.: aluguel" />
          <input value={expenseAmount} onChange={(event) => setExpenseAmount(event.target.value)} inputMode="decimal" placeholder="Valor mensal" />
          <button>Adicionar</button>
        </form>
        <div className="customer-list">
          {expenses.map((item) => (
            <span key={item.id}>
              <strong>{item.name}</strong> · R$ {item.amount.toFixed(2)}
              <button onClick={() => void saveExpenses(expenses.filter((expense) => expense.id !== item.id))}>Remover</button>
            </span>
          ))}
        </div>
      </section>
      <section className="admin-box area-sistema">
        <div className="box-heading">
          <div>
            <h2>Histórico de alterações</h2>
            <p>Registro das ações administrativas mais recentes.</p>
          </div>
          <a href="/admin/conta">Minha conta</a>
        </div>
        <div className="customer-list">
          {logs.length === 0 ? (
            <span>Nenhuma alteração registrada ainda.</span>
          ) : (
            logs.slice(0, 20).map((item) => (
              <span key={item.id}>
                <strong>{item.action.replaceAll("_", " ")}</strong> ·{" "}
                {item.details || "Sem detalhes"} ·{" "}
                {new Date(`${item.created_at}Z`).toLocaleString("pt-BR")}
              </span>
            ))
          )}
        </div>
        <div className="integration-grid">
          <article><strong>Recuperação de senha</strong><span>Ativa por e-mail protegido</span></article>
          <article><strong>Autenticação em duas etapas</strong><span>Disponível em Minha conta</span></article>
          <article><strong>WhatsApp</strong><span>Confirmação manual ativa · automação aguarda API oficial</span></article>
          <article><strong>Notificações</strong><span>Tempo real no navegador · envio fechado aguarda serviço push</span></article>
        </div>
      </section>
      <GalleryManager />
    </div>
  );
}
