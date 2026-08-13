// Utilidades de formato de fecha, separadas de los componentes de UI para que
// cada archivo de React exporte un único tipo de cosa (regla only-export-components).

export function formatoFecha(iso: string): string {
  try {
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
}

export function formatoFechaHora(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("es-MX", { day: "2-digit", month: "short" });
  } catch {
    return iso;
  }
}
