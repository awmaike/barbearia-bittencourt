"use client";

import { useEffect, useRef, useState } from "react";
import HoursManager from "./HoursManager";
import AdminExtras from "./AdminExtras";

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
  notes?: string;
  payment_status?: string;
  amount_paid?: string;
};
type Block = {
  id: string;
  barber: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  reason: string;
};

const serviceNames: Record<string, string> = {
  corte: "Corte",
  barba: "Barba",
  sobrancelha: "Sobrancelha",
  combo: "Corte + barba",
  corte_sobrancelha: "Corte + sobrancelha",
  barba_sobrancelha: "Barba + sobrancelha",
  corte_barba_sobrancelha: "Corte + barba + sobrancelha",
};
const servicePrices: Record<string, number> = {
  corte: 40,
  barba: 30,
  sobrancelha: 15,
  combo: 70,
  corte_sobrancelha: 55,
  barba_sobrancelha: 45,
  corte_barba_sobrancelha: 85,
};
const barbers = ["Pedrinho", "Treco"];
const daySlots = Array.from({ length: 40 }, (_, index) => {
  const total = 8 * 60 + index * 15;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
});

function today() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
  }).format(new Date());
}

function minutes(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
}

function shiftDate(value: string, days: number) {
  const next = new Date(`${value}T12:00:00`);
  next.setDate(next.getDate() + days);
  return next.toISOString().slice(0, 10);
}

export default function AdminDashboard() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [date, setDate] = useState(today);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [blockBarber, setBlockBarber] = useState("Pedrinho");
  const [blockStart, setBlockStart] = useState("12:00");
  const [blockEnd, setBlockEnd] = useState("13:00");
  const [blockReason, setBlockReason] = useState("Almoço");
  const [search, setSearch] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");
  const [busyAction, setBusyAction] = useState("");
  const knownAppointments = useRef<Set<string> | null>(null);
  const [notifications, setNotifications] = useState(false);

  async function load(filterDate = date, silent = false) {
    if (!silent) {
      setLoading(true);
      setError("");
    }
    try {
      const [response, blocksResponse] = await Promise.all([
        fetch(
          `/api/admin/appointments${filterDate ? `?date=${filterDate}` : ""}`,
        ),
        fetch(`/api/admin/blocks?date=${filterDate}`),
      ]);
      const data = await response.json();
      const blocksData = await blocksResponse.json();
      if (!response.ok)
        setError(data.error ?? "Não foi possível carregar a agenda.");
      else {
        const next: Appointment[] = data.appointments ?? [];
        if (knownAppointments.current && Notification.permission === "granted") {
          next
            .filter((item) => item.status === "confirmed" && !knownAppointments.current?.has(item.id))
            .forEach((item) =>
              new Notification("Novo agendamento", {
                body: `${item.customer_name} · ${serviceNames[item.service] ?? item.service} · ${item.start_time}`,
              }),
            );
        }
        knownAppointments.current = new Set(next.map((item) => item.id));
        setAppointments(next);
      }
      if (blocksResponse.ok) setBlocks(blocksData.blocks ?? []);
      if (response.ok && blocksResponse.ok)
        setLastUpdated(
          new Date().toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }),
        );
    } catch {
      setError("Não foi possível carregar a agenda.");
    } finally {
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => {
    const initialDate = today();
    fetch(`/api/admin/appointments?date=${initialDate}`)
      .then((response) => response.json().then((data) => ({ response, data })))
      .then(({ response, data }) =>
        response.ok
          ? (() => {
              const next = data.appointments ?? [];
              knownAppointments.current = new Set(next.map((item: Appointment) => item.id));
              setAppointments(next);
            })()
          : setError(data.error ?? "Não foi possível carregar a agenda."),
      )
      .catch(() => setError("Não foi possível carregar a agenda."))
      .finally(() => {
        setLoading(false);
        setLastUpdated(new Date().toLocaleTimeString("pt-BR"));
      });
    fetch(`/api/admin/blocks?date=${initialDate}`)
      .then((response) => response.json())
      .then((data) => setBlocks(data.blocks ?? []))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "visible") void load(date, true);
    };
    const timer = window.setInterval(refresh, 15_000);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
    };
    // A data selecionada reinicia o atualizador para consultar o dia correto.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  useEffect(() => {
    if ("serviceWorker" in navigator)
      void navigator.serviceWorker.register("/sw.js");
  }, []);

  async function enableNotifications() {
    if (!("Notification" in window)) return;
    const permission = await Notification.requestPermission();
    setNotifications(permission === "granted");
  }

  async function cancel(id: string) {
    if (!confirm("Deseja cancelar este agendamento e liberar o horário?"))
      return;
    const previous = appointments;
    setBusyAction(id);
    setAppointments((items) =>
      items.map((item) =>
        item.id === id ? { ...item, status: "cancelled" } : item,
      ),
    );
    const response = await fetch("/api/admin/appointments", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (!response.ok) {
      setAppointments(previous);
      setError("Não foi possível cancelar o agendamento.");
    }
    setBusyAction("");
  }

  async function updateStatus(id: string, status: string) {
    const previous = appointments;
    setBusyAction(id);
    setAppointments((items) =>
      items.map((item) => (item.id === id ? { ...item, status } : item)),
    );
    const response = await fetch("/api/admin/appointments", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, action: "status", status }),
    });
    if (!response.ok) {
      setAppointments(previous);
      setError("Não foi possível alterar o status.");
    }
    setBusyAction("");
  }

  async function markDeposit(item: Appointment) {
    const response = await fetch("/api/admin/cash", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        appointmentId: item.id,
        type: "income",
        description: `Sinal - ${item.customer_name}`,
        amount: 10,
        method: "pix",
        date: item.appointment_date,
      }),
    });
    if (response.ok) await load(date);
    else setError("Não foi possível registrar o sinal.");
  }

  async function refundDeposit(item: Appointment) {
    if (!confirm("Confirmar reembolso de R$ 10 e registrar a saída no caixa?"))
      return;
    const response = await fetch("/api/admin/cash", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        appointmentId: item.id,
        type: "expense",
        description: `Reembolso de sinal - ${item.customer_name}`,
        amount: 10,
        method: "pix",
        date: item.appointment_date,
      }),
    });
    if (response.ok) await load(date);
    else setError("Não foi possível reembolsar o sinal.");
  }

  async function editAppointment(item: Appointment) {
    const nextDate = prompt("Data (AAAA-MM-DD)", item.appointment_date);
    if (!nextDate) return;
    const start = prompt("Horário inicial (HH:MM)", item.start_time);
    if (!start) return;
    const barber = prompt("Barbeiro: Pedrinho ou Treco", item.barber);
    if (!barber) return;
    const service = prompt(
      "Serviço: corte, barba, sobrancelha, combo, corte_sobrancelha ou corte_barba_sobrancelha",
      item.service,
    );
    if (!service) return;
    const response = await fetch("/api/admin/appointments", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        id: item.id,
        date: nextDate,
        start,
        barber,
        service,
      }),
    });
    const data = await response.json();
    if (response.ok) await load(date);
    else setError(data.error ?? "Não foi possível editar.");
  }

  async function createBlock() {
    setError("");
    const response = await fetch("/api/admin/blocks", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        barber: blockBarber,
        date,
        start: blockStart,
        end: blockEnd,
        reason: blockReason,
      }),
    });
    const data = await response.json();
    if (!response.ok) setError(data.error ?? "Não foi possível bloquear.");
    else await load(date);
  }

  async function removeBlock(id: string) {
    await fetch("/api/admin/blocks", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await load(date);
  }

  const visibleAppointments = appointments.filter(
    (item) =>
      !search ||
      `${item.customer_name} ${item.phone}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const confirmed = appointments.filter((item) => item.status === "confirmed");
  const estimatedRevenue = confirmed.reduce(
    (sum, item) => sum + (servicePrices[item.service] ?? 0),
    0,
  );
  const now = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
  const nextAppointment =
    date === today()
      ? confirmed.find((item) => item.start_time >= now)
      : confirmed[0];
  const pendingDeposits = confirmed.filter(
    (item) => item.payment_status !== "deposit_paid",
  ).length;

  return (
    <div className="admin-dashboard">
      <div className="admin-toolbar">
        <button
          onClick={() => {
            const previous = shiftDate(date, -1);
            setDate(previous);
            void load(previous);
          }}
        >
          ← Dia anterior
        </button>
        <div>
          <label htmlFor="filter-date">Dia da agenda</label>
          <input
            id="filter-date"
            type="date"
            value={date}
            onChange={(event) => {
              setDate(event.target.value);
              void load(event.target.value);
            }}
          />
        </div>
        <button
          onClick={() => {
            const next = shiftDate(date, 1);
            setDate(next);
            void load(next);
          }}
        >
          Próximo dia →
        </button>
        <div>
          <label htmlFor="admin-search">Buscar cliente</label>
          <input
            id="admin-search"
            placeholder="Nome ou telefone"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <button
          onClick={() => {
            const current = today();
            setDate(current);
            void load(current);
          }}
        >
          Hoje
        </button>
        <button onClick={() => void load(date)}>Atualizar</button>
        <button onClick={() => void enableNotifications()}>
          {notifications || (typeof Notification !== "undefined" && Notification.permission === "granted")
            ? "Avisos ativados"
            : "Ativar avisos"}
        </button>
      </div>
      <div className="auto-refresh-status" role="status">
        <span /> Atualização automática a cada 15 segundos
        {lastUpdated && <small>Última consulta: {lastUpdated}</small>}
      </div>
      {error && <p className="admin-error">{error}</p>}
      {loading ? (
        <p>Carregando agenda…</p>
      ) : (
        <>
          <div className="admin-metrics">
            <div>
              <strong>{confirmed.length}</strong>
              <span>Confirmados</span>
            </div>
            <div>
              <strong>R$ {estimatedRevenue}</strong>
              <span>Previsão do dia</span>
            </div>
            <div>
              <strong>
                {
                  appointments.filter((item) => item.status === "cancelled")
                    .length
                }
              </strong>
              <span>Cancelados</span>
            </div>
            <div>
              <strong>
                {nextAppointment
                  ? `${nextAppointment.start_time} · ${nextAppointment.customer_name}`
                  : "—"}
              </strong>
              <span>Próximo cliente</span>
            </div>
            <div>
              <strong>{pendingDeposits}</strong>
              <span>Sinais pendentes</span>
            </div>
          </div>
          <div className="admin-summary">
            <strong>{confirmed.length}</strong>
            <span>
              agendamentos confirmados em {date.split("-").reverse().join("/")}
            </span>
            <small>
              Os registros ficam salvos e não são apagados ao mudar o dia.
            </small>
          </div>
          <details className="admin-disclosure">
            <summary>
              <span>Horários e bloqueios</span>
              <small>Almoço, folga e expediente dos barbeiros</small>
            </summary>
            <section className="block-panel">
              <div>
                <h2>Bloquear horário</h2>
                <p>Use para almoço, folga, feriado ou ausência.</p>
              </div>
              <select
                value={blockBarber}
                onChange={(event) => setBlockBarber(event.target.value)}
              >
                {barbers.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
              <input
                type="time"
                step="900"
                value={blockStart}
                onChange={(event) => setBlockStart(event.target.value)}
              />
              <input
                type="time"
                step="900"
                value={blockEnd}
                onChange={(event) => setBlockEnd(event.target.value)}
              />
              <input
                value={blockReason}
                onChange={(event) => setBlockReason(event.target.value)}
                placeholder="Motivo"
              />
              <button onClick={createBlock}>Bloquear</button>
            </section>
            {blocks.length > 0 && (
              <div className="block-list">
                {blocks.map((block) => (
                  <span key={block.id}>
                    <strong>{block.barber}</strong> · {block.start_time}–
                    {block.end_time} · {block.reason}
                    <button onClick={() => void removeBlock(block.id)}>
                      Liberar
                    </button>
                  </span>
                ))}
              </div>
            )}
            <HoursManager />
          </details>
          <details className="admin-disclosure">
            <summary>
              <span>Grade visual do dia</span>
              <small>
                Veja os horários livres e ocupados em blocos de 15 minutos
              </small>
            </summary>
            <div className="day-agenda">
              <div className="day-agenda-head">
                <span>Horário</span>
                {barbers.map((barber) => (
                  <strong key={barber}>{barber}</strong>
                ))}
              </div>
              {daySlots.map((slot) => (
                <div className="day-agenda-row" key={slot}>
                  <time>{slot}</time>
                  {barbers.map((barber) => {
                    const appointment = appointments.find(
                      (item) =>
                        item.status === "confirmed" &&
                        item.barber === barber &&
                        minutes(slot) >= minutes(item.start_time) &&
                        minutes(slot) < minutes(item.end_time),
                    );
                    const block = blocks.find(
                      (item) =>
                        item.barber === barber &&
                        minutes(slot) >= minutes(item.start_time) &&
                        minutes(slot) < minutes(item.end_time),
                    );
                    const beginsHere = appointment?.start_time === slot;
                    return (
                      <div
                        className={
                          appointment
                            ? "schedule-slot occupied"
                            : block
                              ? "schedule-slot blocked"
                              : "schedule-slot free"
                        }
                        key={barber}
                      >
                        {appointment ? (
                          <>
                            <strong>
                              {beginsHere
                                ? appointment.customer_name
                                : "Continuação"}
                            </strong>
                            <small>
                              {beginsHere
                                ? (serviceNames[appointment.service] ??
                                  appointment.service)
                                : `${appointment.start_time}–${appointment.end_time}`}
                            </small>
                          </>
                        ) : block ? (
                          <>
                            <strong>Bloqueado</strong>
                            <small>{block.reason}</small>
                          </>
                        ) : (
                          <span>Livre</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </details>
          <h2 className="admin-section-title">Agendamentos do dia</h2>
          {visibleAppointments.length === 0 ? (
            <div className="admin-empty">
              Nenhum agendamento encontrado neste dia.
            </div>
          ) : (
            <div className="admin-list">
              {visibleAppointments.map((item) => {
                const reminder = encodeURIComponent(
                  `Olá, ${item.customer_name}! Lembrando do seu horário na Barbearia Bittencourt em ${item.appointment_date.split("-").reverse().join("/")} às ${item.start_time}, com ${item.barber}.`,
                );
                const depositMessage = encodeURIComponent(
                  `Olá, ${item.customer_name}! Seu horário na Barbearia Bittencourt está reservado para ${item.appointment_date.split("-").reverse().join("/")} às ${item.start_time}. Para esta demonstração, o sinal é de R$ 10 e a chave Pix fictícia é 00000000000. Não realize pagamentos.`,
                );
                return (
                  <article
                    className={`admin-appointment ${item.status}`}
                    key={item.id}
                  >
                    <div className="appointment-date">
                      <strong>{item.start_time}</strong>
                      <span>
                        {item.appointment_date.split("-").reverse().join("/")}
                      </span>
                    </div>
                    <div>
                      <h2>{item.customer_name}</h2>
                      <p>
                        {serviceNames[item.service] ?? item.service} ·{" "}
                        {item.barber} · {item.start_time} às {item.end_time} ·
                        R$ {servicePrices[item.service] ?? 0}
                      </p>
                      {item.notes && (
                        <p>
                          <strong>Observação:</strong> {item.notes}
                        </p>
                      )}
                      <a
                        href={`https://wa.me/55${item.phone}?text=${reminder}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Enviar lembrete pelo WhatsApp
                      </a>
                      {item.payment_status !== "deposit_paid" && (
                        <a
                          href={`https://wa.me/55${item.phone}?text=${depositMessage}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Pedir sinal pelo WhatsApp
                        </a>
                      )}
                      <div className="appointment-actions">
                        <button onClick={() => void editAppointment(item)}>
                          Editar
                        </button>
                        {item.payment_status === "deposit_paid" ? (
                          <>
                            <span className="status-label">
                              Sinal pago · R${" "}
                              {Number(item.amount_paid ?? 10).toFixed(2)}
                            </span>
                            <button onClick={() => void refundDeposit(item)}>
                              Reembolsar sinal
                            </button>
                          </>
                        ) : item.payment_status === "refunded" ? (
                          <span className="status-label">
                            Sinal reembolsado
                          </span>
                        ) : (
                          <button onClick={() => void markDeposit(item)}>
                            Registrar sinal R$ 10
                          </button>
                        )}
                        <button
                          disabled={busyAction === item.id}
                          onClick={() =>
                            void updateStatus(item.id, "completed")
                          }
                        >
                          Concluído
                        </button>
                        <button
                          disabled={busyAction === item.id}
                          onClick={() => void updateStatus(item.id, "no_show")}
                        >
                          Não compareceu
                        </button>
                      </div>
                    </div>
                    <span className="status-label">
                      {{
                        confirmed: "Confirmado",
                        cancelled: "Cancelado",
                        completed: "Concluído",
                        no_show: "Faltou",
                      }[item.status] ?? item.status}
                    </span>
                    {item.status === "confirmed" && (
                      <button
                        className="cancel-button"
                        disabled={busyAction === item.id}
                        onClick={() => cancel(item.id)}
                      >
                        {busyAction === item.id
                          ? "Salvando…"
                          : "Cancelar e liberar"}
                      </button>
                    )}
                  </article>
                );
              })}
            </div>
          )}
          <AdminExtras date={date} onChanged={() => void load(date)} />
        </>
      )}
    </div>
  );
}
