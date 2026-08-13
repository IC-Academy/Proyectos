// Helpers puros (sin JSX) para colores de badge y estatus, separados de los
// componentes de UI para que cada archivo de React exporte un único tipo de
// cosa (regla only-export-components / react-refresh).

export type ColorBadge = "green" | "yellow" | "red" | "purple" | "gray" | "blue" | "orange";

export function iniciales(nombre: string): string {
  return nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function colorPorEstado(estado: string): ColorBadge {
  switch (estado) {
    case "Completada":
      return "green";
    case "En tiempo":
    case "En progreso":
      return "blue";
    case "Por vencer":
      return "yellow";
    case "Vencida":
      return "red";
    case "Bloqueada":
      return "purple";
    case "Pendiente de aprobación":
      return "orange";
    default:
      return "gray";
  }
}

export function colorPorPrioridad(p: string): ColorBadge {
  switch (p) {
    case "Crítica":
      return "red";
    case "Alta":
      return "orange";
    case "Media":
      return "blue";
    default:
      return "gray";
  }
}

export function colorEstatusSolicitud(estatus: string): ColorBadge {
  switch (estatus) {
    case "Aceptada":
      return "green";
    case "Rechazada":
    case "Cancelada":
      return "red";
    case "Cambios solicitados":
      return "yellow";
    default:
      return "orange";
  }
}
