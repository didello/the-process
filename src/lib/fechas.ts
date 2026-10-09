// Fechas en formato "YYYY-MM-DD" (hora local). Las semanas van de lunes a domingo.

export const DIAS = ["LUNES", "MARTES", "MIÉRCOLES", "JUEVES", "VIERNES", "SÁBADO", "DOMINGO"];
export const DIAS_CORTOS = ["L", "M", "X", "J", "V", "S", "D"];

const pad = (n: number) => String(n).padStart(2, "0");

export const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export function parseISO(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function sumarDias(iso: string, n: number) {
  const d = parseISO(iso);
  d.setDate(d.getDate() + n);
  return toISO(d);
}

export const hoy = () => toISO(new Date());

/** Lunes de la semana de esa fecha. */
export function lunesDe(iso: string) {
  const d = parseISO(iso);
  return sumarDias(iso, -((d.getDay() + 6) % 7));
}

export const diasDeSemana = (lunes: string) => Array.from({ length: 7 }, (_, i) => sumarDias(lunes, i));

export const fechaCorta = (iso: string) => parseISO(iso).toLocaleDateString("es-ES", { day: "numeric", month: "short" }).replace(".", "");

export function fechaLarga(iso: string) {
  const s = parseISO(iso).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function rangoSemana(lunes: string) {
  const domingo = sumarDias(lunes, 6);
  return `${fechaCorta(lunes)} – ${fechaCorta(domingo)}`;
}
