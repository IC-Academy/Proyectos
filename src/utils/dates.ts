// Utilidades de fechas. Todas las fechas del sistema se manejan como strings ISO "YYYY-MM-DD".

export function hoy(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function parseFecha(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function formatFecha(iso?: string): string {
  if (!iso) return "-";
  const d = parseFecha(iso);
  return d.toLocaleDateString("es-MX", { year: "numeric", month: "short", day: "2-digit" });
}

export function formatFechaHora(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("es-MX", { year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export function diffDias(a: Date, b: Date): number {
  const MS = 1000 * 60 * 60 * 24;
  return Math.round((b.getTime() - a.getTime()) / MS);
}

export function diasRestantes(fechaFin: string): number {
  return diffDias(hoy(), parseFecha(fechaFin));
}

export function estaVencido(fechaFin: string): boolean {
  return diasRestantes(fechaFin) < 0;
}

export function proximoAVencer(fechaFin: string, umbralDias = 10): boolean {
  const d = diasRestantes(fechaFin);
  return d >= 0 && d <= umbralDias;
}

// Avance esperado según porcentaje de tiempo transcurrido entre fechaInicio y fechaFin, acotado 0-100.
export function avanceEsperado(fechaInicio: string, fechaFin: string): number {
  const inicio = parseFecha(fechaInicio);
  const fin = parseFecha(fechaFin);
  const ahora = hoy();
  const total = diffDias(inicio, fin);
  if (total <= 0) return 100;
  const transcurrido = diffDias(inicio, ahora);
  const pct = (transcurrido / total) * 100;
  return Math.max(0, Math.min(100, Math.round(pct)));
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function todayIso(): string {
  const d = hoy();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}
