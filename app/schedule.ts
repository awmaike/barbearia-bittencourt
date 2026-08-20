export const BARBERS = ["Pedrinho", "Treco"] as const;
export const SERVICES = {
  corte: { label: "Corte", duration: 25, price: 40 },
  barba: { label: "Barba", duration: 25, price: 30 },
  sobrancelha: { label: "Sobrancelha", duration: 10, price: 15 },
  combo: { label: "Corte + barba", duration: 50, price: 70 },
  corte_sobrancelha: { label: "Corte + sobrancelha", duration: 35, price: 55 },
  barba_sobrancelha: { label: "Barba + sobrancelha", duration: 35, price: 45 },
  corte_barba_sobrancelha: {
    label: "Corte + barba + sobrancelha",
    duration: 60,
    price: 85,
  },
} as const;

export type Barber = (typeof BARBERS)[number];
export type ServiceKey = keyof typeof SERVICES;

export function isBarber(value: string): value is Barber {
  return BARBERS.includes(value as Barber);
}

export function isService(value: string): value is ServiceKey {
  return Object.hasOwn(SERVICES, value);
}

export function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

export function minutesToTime(value: number) {
  return `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
}

export function slotsFor(startTime: string, duration: number) {
  const start = timeToMinutes(startTime);
  return Array.from({ length: duration / 5 }, (_, index) =>
    minutesToTime(start + index * 5),
  );
}

export function validBusinessDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00-03:00`);
  if (Number.isNaN(date.getTime()) || date.getDay() === 0) return false;
  const today = new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }),
  );
  today.setHours(0, 0, 0, 0);
  const candidate = new Date(`${value}T12:00:00-03:00`);
  const lastDay = new Date(today);
  lastDay.setDate(lastDay.getDate() + 60);
  return candidate >= today && candidate <= lastDay;
}

export function validStartTime(startTime: string, duration: number) {
  if (!/^\d{2}:\d{2}$/.test(startTime)) return false;
  const start = timeToMinutes(startTime);
  return start >= 8 * 60 && start % 15 === 0 && start + duration <= 18 * 60;
}
