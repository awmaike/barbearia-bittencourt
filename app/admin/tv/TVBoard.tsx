"use client";

import { useEffect, useState } from "react";
type Appointment = {
  id: string;
  customer_name: string;
  service: string;
  barber: string;
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
  corte_barba_sobrancelha: "Todos",
};
function today() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
  }).format(new Date());
}
function minutes(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
}
export default function TVBoard() {
  const [appointments, setAppointments] = useState<Appointment[]>([]),
    [clock, setClock] = useState("");
  useEffect(() => {
    const load = () => {
      setClock(
        new Date().toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
      fetch(`/api/admin/appointments?date=${today()}`)
        .then((response) => response.json())
        .then((data) => setAppointments(data.appointments ?? []));
    };
    load();
    const timer = setInterval(load, 60000);
    return () => clearInterval(timer);
  }, []);
  return (
    <main className="tv-shell">
      <header>
        <div>
          <p>Barbearia Bittencourt</p>
          <h1>Agenda de hoje</h1>
        </div>
        <time>{clock}</time>
      </header>
      <div className="tv-columns">
        {["Pedrinho", "Treco"].map((barber) => {
          const items = appointments.filter(
            (item) => item.barber === barber && item.status === "confirmed",
          );
          const now = minutes(clock || "00:00"),
            next = items.find((item) => minutes(item.start_time) >= now);
          return (
            <section key={barber}>
              <h2>{barber}</h2>
              {items.map((item) => {
                const late =
                    now > minutes(item.start_time) &&
                    now < minutes(item.end_time),
                  isNext = next?.id === item.id;
                return (
                  <article
                    className={late ? "tv-late" : isNext ? "tv-next" : ""}
                    key={item.id}
                  >
                    <strong>{item.start_time}</strong>
                    <div>
                      <h3>
                        {item.customer_name}{" "}
                        {late && <small>EM ATENDIMENTO</small>}
                        {isNext && <small>PRÓXIMO</small>}
                      </h3>
                      <p>
                        {names[item.service] ?? item.service} · até{" "}
                        {item.end_time}
                      </p>
                    </div>
                  </article>
                );
              })}
            </section>
          );
        })}
      </div>
    </main>
  );
}
