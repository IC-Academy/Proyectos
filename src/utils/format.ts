export function formatMoneda(valor: number, unidad?: string): string {
  if (unidad && unidad !== "MXN" && !unidad.match(/^\$|peso/i)) {
    return `${formatNumero(valor)} ${unidad}`;
  }
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(valor);
}

export function formatNumero(valor: number): string {
  return new Intl.NumberFormat("es-MX", { maximumFractionDigits: 1 }).format(valor);
}

export function formatPorcentaje(valor: number): string {
  return `${Math.round(valor)}%`;
}

export function iniciales(nombre: string): string {
  return nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}
