"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

const services = [
  { value: "corte", label: "Corte", duration: 25, price: 40 },
  { value: "barba", label: "Barba", duration: 25, price: 30 },
  { value: "sobrancelha", label: "Sobrancelha", duration: 10, price: 15 },
];

function selectedServiceKey(selected: string[]) {
  const ordered = ["corte", "barba", "sobrancelha"].filter((item) =>
    selected.includes(item),
  );
  if (ordered.length === 1) return ordered[0];
  if (ordered.join("_") === "corte_barba") return "combo";
  return ordered.join("_");
}

function localDate(offset = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

export default function Booking() {
  const [selectedServices, setSelectedServices] = useState(["corte"]);
  const service = selectedServiceKey(selectedServices);
  const [barber, setBarber] = useState("Pedrinho");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [times, setTimes] = useState<string[]>([]);
  const [loadingTimes, setLoadingTimes] = useState(false);
  const [maintenance, setMaintenance] = useState(false);
  const [message, setMessage] = useState<{
    kind: "success" | "error";
    text: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [cancelUrl, setCancelUrl] = useState("");
  const [pixInfo, setPixInfo] = useState<{
    key: string;
    amount: number;
    remaining: number;
  } | null>(null);
  const minDate = useMemo(() => localDate(), []);
  const maxDate = useMemo(() => localDate(60), []);

  async function refreshTimes(
    nextDate: string,
    nextBarber: string,
    nextService: string,
  ) {
    setTime("");
    setTimes([]);
    if (!nextDate) return;
    setLoadingTimes(true);
    try {
      const response = await fetch(
        `/api/availability?date=${nextDate}&barber=${nextBarber}&service=${nextService}`,
      );
      const data = await response.json();
      setMaintenance(Boolean(data.maintenance));
      if (data.maintenance)
        setMessage({
          kind: "error",
          text: data.message || "Agenda em manutenção.",
        });
      else
        setMessage((current) =>
          current?.text.toLowerCase().includes("manutenção") ? null : current,
        );
      setTimes(Array.isArray(data.times) ? data.times : []);
    } catch {
      setMessage({
        kind: "error",
        text: "Não foi possível carregar os horários.",
      });
    } finally {
      setLoadingTimes(false);
    }
  }

  useEffect(() => {
    if (!date) return;
    const refresh = () => {
      if (document.visibilityState === "visible")
        void refreshTimes(date, barber, service);
    };
    const timer = window.setInterval(refresh, 10_000);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
    };
    // Reconsulta quando a seleção muda e mantém uma página já aberta sincronizada.
  }, [date, barber, service]);

  function chooseService(nextService: string) {
    const next = selectedServices.includes(nextService)
      ? selectedServices.filter((item) => item !== nextService)
      : [...selectedServices, nextService];
    if (next.length === 0) return;
    setSelectedServices(next);
    void refreshTimes(date, barber, selectedServiceKey(next));
  }

  function chooseBarber(nextBarber: string) {
    setBarber(nextBarber);
    void refreshTimes(date, nextBarber, service);
  }

  function chooseDate(nextDate: string) {
    setDate(nextDate);
    void refreshTimes(nextDate, barber, service);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setMessage(null);
    setCancelUrl("");
    setPixInfo(null);
    setSubmitting(true);
    try {
      const form = new FormData(formElement);
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          customerName: form.get("customerName"),
          phone: form.get("phone"),
          appointmentDate: date,
          startTime: time,
          barber,
          service,
        }),
      });
      const data = (await response.json()) as {
        error?: string;
        appointment?: {
          cancelToken: string;
          depositAmount: number;
          pixKey: string;
        };
      };
      if (!response.ok) {
        setMessage({
          kind: "error",
          text: data.error ?? "Não foi possível agendar.",
        });
        return;
      }
      const cancelPath = data.appointment?.cancelToken
        ? `${window.location.origin}/cancelar/${data.appointment.cancelToken}`
        : "";
      setCancelUrl(cancelPath);
      const total = selectedServices.reduce(
        (sum, value) =>
          sum + (services.find((item) => item.value === value)?.price ?? 0),
        0,
      );
      if (data.appointment)
        setPixInfo({
          key: data.appointment.pixKey,
          amount: data.appointment.depositAmount,
          remaining: Math.max(0, total - data.appointment.depositAmount),
        });
      setMessage({
        kind: "success",
        text: `Horário confirmado com ${barber} no dia ${date.split("-").reverse().join("/")} às ${time}.`,
      });
      formElement.reset();
      await refreshTimes(date, barber, service);
    } catch {
      setMessage({
        kind: "error",
        text: "Não foi possível confirmar agora. Verifique sua conexão e tente novamente.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="booking-section" id="agendar">
      <div className="booking-intro">
        <p className="eyebrow">Agenda online</p>
        <h2>
          Reserve seu horário
          <br />
          <em>em poucos passos.</em>
        </h2>
        <p>
          Escolha o serviço, o profissional e um horário disponível.
          Atendimentos de segunda a sábado, das 8h às 18h.
        </p>
        <div className="booking-hours">
          <span>SEG — SÁB</span>
          <strong>08:00 — 18:00</strong>
        </div>
      </div>
      <form className="booking-card" onSubmit={submit}>
        {maintenance && (
          <div className="booking-maintenance" role="status">
            Agenda temporariamente em manutenção. Esta tela verificará
            automaticamente quando os horários forem liberados.
          </div>
        )}
        <div className="form-step">
          <span>1</span>
          <div>
            <label>
              Serviços <small>— selecione um ou mais</small>
            </label>
            <div className="choice-grid services-choice">
              {services.map((item) => (
                <button
                  type="button"
                  aria-pressed={selectedServices.includes(item.value)}
                  className={
                    selectedServices.includes(item.value) ? "selected" : ""
                  }
                  onClick={() => chooseService(item.value)}
                  key={item.value}
                >
                  <strong>
                    {selectedServices.includes(item.value) ? "✓ " : "+ "}
                    {item.label}
                  </strong>
                  <small>
                    {item.duration} min · R$ {item.price}
                  </small>
                </button>
              ))}
            </div>
            <p className="selection-summary">
              Total selecionado:{" "}
              {selectedServices.reduce(
                (sum, value) =>
                  sum +
                  (services.find((item) => item.value === value)?.duration ??
                    0),
                0,
              )}{" "}
              min · R${" "}
              {selectedServices.reduce(
                (sum, value) =>
                  sum +
                  (services.find((item) => item.value === value)?.price ?? 0),
                0,
              )}
            </p>
          </div>
        </div>
        <div className="form-step">
          <span>2</span>
          <div>
            <label>Profissional</label>
            <div className="choice-grid">
              {["Pedrinho", "Treco"].map((item) => (
                <button
                  type="button"
                  className={barber === item ? "selected" : ""}
                  onClick={() => chooseBarber(item)}
                  key={item}
                >
                  <strong>{item}</strong>
                  {item === "Pedrinho" && <small>Mais disponível</small>}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="form-step">
          <span>3</span>
          <div>
            <label htmlFor="booking-date">Data</label>
            <input
              id="booking-date"
              type="date"
              min={minDate}
              max={maxDate}
              value={date}
              onChange={(event) => chooseDate(event.target.value)}
              required
            />
          </div>
        </div>
        {date && (
          <div className="form-step">
            <span>4</span>
            <div>
              <label>Horários disponíveis</label>
              <div className="time-grid">
                {loadingTimes ? (
                  <p>Carregando…</p>
                ) : times.length ? (
                  times.map((item) => (
                    <button
                      type="button"
                      className={time === item ? "selected" : ""}
                      onClick={() => setTime(item)}
                      key={item}
                    >
                      {item}
                    </button>
                  ))
                ) : (
                  <p>Nenhum horário disponível nesta data.</p>
                )}
              </div>
            </div>
          </div>
        )}
        <div className="form-step">
          <span>5</span>
          <div className="customer-fields">
            <label htmlFor="customer-name">Seus dados</label>
            <input
              id="customer-name"
              name="customerName"
              placeholder="Nome completo"
              minLength={2}
              maxLength={80}
              required
            />
            <input
              name="phone"
              inputMode="tel"
              placeholder="WhatsApp com DDD"
              minLength={10}
              maxLength={18}
              required
            />
            <textarea
              name="notes"
              placeholder="Observações (opcional): tipo de corte, preferência…"
              maxLength={300}
            />
            <small>
              Usaremos seu telefone somente para contato sobre este agendamento.
            </small>
          </div>
        </div>
        {message && (
          <p className={`form-message ${message.kind}`} role="status">
            {message.text}
          </p>
        )}
        {cancelUrl && (
          <a className="cancel-link" href={cancelUrl}>
            Abrir e guardar meu link de cancelamento
          </a>
        )}
        {pixInfo && (
          <div className="pix-box">
            <div
              className="demo-qr"
              aria-label="QR Code ilustrativo e sem validade"
            >
              <span />
              <span />
              <span />
              <i />
            </div>
            <div className="pix-copy">
              <strong>Apresentação — não realizar pagamento</strong>
              <span>Sinal demonstrativo: R$ {pixInfo.amount.toFixed(2)}</span>
              <span>
                Chave Pix fictícia:{" "}
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(pixInfo.key)}
                >
                  {pixInfo.key} · copiar
                </button>
              </span>
              <small>
                QR Code meramente ilustrativo. Restante demonstrativo: R${" "}
                {pixInfo.remaining.toFixed(2)}.
              </small>
            </div>
          </div>
        )}
        <button
          className="button booking-submit"
          disabled={!date || !time || submitting}
        >
          {submitting ? "Confirmando…" : "Confirmar agendamento"}
        </button>
      </form>
    </section>
  );
}
