"use client";
/* eslint-disable @next/next/no-html-link-for-pages */

import { useEffect, useState } from "react";

type Appointment = {
  customer_name: string;
  service: string;
  barber: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: string;
};
const names: Record<string, string> = {
  corte: "Corte",
  barba: "Barba",
  sobrancelha: "Sobrancelha",
  combo: "Corte + barba",
  corte_sobrancelha: "Corte + sobrancelha",
  barba_sobrancelha: "Barba + sobrancelha",
  corte_barba_sobrancelha: "Corte + barba + sobrancelha",
};

export default function CancelAppointment({ token }: { token: string }) {
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [message, setMessage] = useState("Carregando agendamento…");
  const [loading, setLoading] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [times, setTimes] = useState<string[]>([]);
  useEffect(() => {
    fetch(`/api/cancel?token=${token}`)
      .then(async (response) => ({ response, data: await response.json() }))
      .then(({ response, data }) => {
        if (!response.ok) setMessage(data.error);
        else {
          setAppointment(data.appointment);
          setMessage("");
        }
      })
      .catch(() => setMessage("Não foi possível carregar o agendamento."));
  }, [token]);
  async function cancel() {
    if (!confirm("Deseja realmente cancelar e liberar este horário?")) return;
    setLoading(true);
    try {
      const response = await fetch("/api/cancel", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await response.json();
      if (!response.ok) setMessage(data.error ?? "Não foi possível cancelar.");
      else {
        setAppointment((current) =>
          current ? { ...current, status: "cancelled" } : current,
        );
        setMessage("Agendamento cancelado. O horário já voltou para a agenda.");
      }
    } catch {
      setMessage("Não foi possível cancelar agora. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }
  async function chooseDate(value: string) {
    setNewDate(value);
    if (!appointment) return;
    const data = await fetch(
      `/api/availability?date=${value}&barber=${appointment.barber}&service=${appointment.service}`,
    ).then((response) => response.json());
    setTimes(data.times ?? []);
  }
  async function reschedule(start: string) {
    if (
      !appointment ||
      !newDate ||
      !confirm(
        `Reagendar para ${newDate.split("-").reverse().join("/")} às ${start}?`,
      )
    )
      return;
    setLoading(true);
    try {
      const response = await fetch("/api/cancel", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, date: newDate, start }),
      });
      const data = await response.json();
      if (!response.ok) setMessage(data.error);
      else {
        setAppointment({ ...appointment, ...data.appointment });
        setMessage("Horário reagendado com sucesso.");
        setTimes([]);
      }
    } catch {
      setMessage("Não foi possível reagendar.");
    } finally {
      setLoading(false);
    }
  }
  return (
    <main className="cancel-shell">
      <a href="/">← Voltar ao site</a>
      <section>
        <p className="eyebrow">Barbearia Bittencourt</p>
        <h1>Seu agendamento</h1>
        {message && <p className="cancel-message">{message}</p>}
        {appointment && (
          <div className="cancel-card">
            <h2>{appointment.customer_name}</h2>
            <p>
              {names[appointment.service] ?? appointment.service} com{" "}
              {appointment.barber}
            </p>
            <strong>
              {appointment.appointment_date.split("-").reverse().join("/")} ·{" "}
              {appointment.start_time} às {appointment.end_time}
            </strong>
            {appointment.status === "confirmed" ? (
              <>
                <div className="reschedule-box">
                  <label>Escolha outra data</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(event) => void chooseDate(event.target.value)}
                  />
                  <div>
                    {times.map((time) => (
                      <button
                        key={time}
                        disabled={loading}
                        onClick={() => void reschedule(time)}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  className="cancel-button"
                  disabled={loading}
                  onClick={cancel}
                >
                  {loading ? "Aguarde…" : "Cancelar agendamento"}
                </button>
              </>
            ) : (
              <span className="cancelled-label">Agendamento cancelado</span>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
