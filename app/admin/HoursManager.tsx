"use client";

import { useEffect, useState } from "react";

type Hours = {
  barber: string;
  weekday: string;
  enabled: string;
  start_time: string;
  end_time: string;
};
const barbers = ["Pedrinho", "Treco"];
const days = [
  { id: "1", name: "Seg" },
  { id: "2", name: "Ter" },
  { id: "3", name: "Qua" },
  { id: "4", name: "Qui" },
  { id: "5", name: "Sex" },
  { id: "6", name: "Sáb" },
];

export default function HoursManager() {
  const [hours, setHours] = useState<Hours[]>([]);
  const [message, setMessage] = useState("");
  useEffect(() => {
    fetch("/api/admin/hours")
      .then((response) => response.json())
      .then((data) => setHours(data.hours ?? []))
      .catch(() => setMessage("Não foi possível carregar os horários."));
  }, []);
  function value(barber: string, weekday: string): Hours {
    return (
      hours.find(
        (item) => item.barber === barber && item.weekday === weekday,
      ) ?? {
        barber,
        weekday,
        enabled: "1",
        start_time: "08:00",
        end_time: "18:00",
      }
    );
  }
  async function save(entry: Hours) {
    setMessage("Salvando…");
    const response = await fetch("/api/admin/hours", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        barber: entry.barber,
        weekday: entry.weekday,
        enabled: entry.enabled === "1",
        start: entry.start_time,
        end: entry.end_time,
      }),
    });
    if (response.ok) {
      setHours((current) => [
        ...current.filter(
          (item) =>
            !(item.barber === entry.barber && item.weekday === entry.weekday),
        ),
        entry,
      ]);
      setMessage("Horários atualizados.");
    } else setMessage("Não foi possível salvar.");
  }
  return (
    <section className="hours-panel">
      <div>
        <h2>Horários de trabalho</h2>
        <p>Configure os dias e o expediente de cada barbeiro.</p>
      </div>
      {barbers.map((barber) => (
        <div className="hours-barber" key={barber}>
          <h3>{barber}</h3>
          {days.map((day) => {
            const entry = value(barber, day.id);
            return (
              <div className="hours-row" key={day.id}>
                <strong>{day.name}</strong>
                <label>
                  <input
                    type="checkbox"
                    checked={entry.enabled === "1"}
                    onChange={(event) =>
                      void save({
                        ...entry,
                        enabled: event.target.checked ? "1" : "0",
                      })
                    }
                  />{" "}
                  Atende
                </label>
                <input
                  type="time"
                  step="900"
                  value={entry.start_time}
                  onChange={(event) =>
                    setHours((current) => [
                      ...current.filter(
                        (item) =>
                          !(item.barber === barber && item.weekday === day.id),
                      ),
                      { ...entry, start_time: event.target.value },
                    ])
                  }
                />
                <input
                  type="time"
                  step="900"
                  value={entry.end_time}
                  onChange={(event) =>
                    setHours((current) => [
                      ...current.filter(
                        (item) =>
                          !(item.barber === barber && item.weekday === day.id),
                      ),
                      { ...entry, end_time: event.target.value },
                    ])
                  }
                />
                <button onClick={() => void save(value(barber, day.id))}>
                  Salvar
                </button>
              </div>
            );
          })}
        </div>
      ))}
      {message && <small>{message}</small>}
    </section>
  );
}
