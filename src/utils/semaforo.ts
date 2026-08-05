import type { Semaforo, EstatusElemento } from "../types";
import { avanceEsperado, estaVencido } from "./dates";

/**
 * Semáforo:
 *  - Gris: el elemento aún no inicia.
 *  - Verde: avance real >= esperado, o desviación menor a 5 puntos, o ya está Completado/Cerrado.
 *  - Amarillo: retraso de 5 a 15 puntos.
 *  - Rojo: retraso mayor a 15 puntos, o vencido sin completar.
 */
export function calcularSemaforo(
  avanceReal: number,
  fechaInicio: string,
  fechaFin: string,
  estatus: EstatusElemento
): Semaforo {
  if (estatus === "Completado" || estatus === "Cerrado") return "verde";
  if (estatus === "Sin iniciar") return "gris";

  const esperado = avanceEsperado(fechaInicio, fechaFin);
  const desviacion = avanceReal - esperado;

  if (estaVencido(fechaFin) && avanceReal < 100) return "rojo";
  if (desviacion >= -5) return "verde";
  if (desviacion >= -15) return "amarillo";
  return "rojo";
}

export const semaforoColor: Record<Semaforo, string> = {
  verde: "#1F9D68",
  amarillo: "#F4B740",
  rojo: "#D64545",
  gris: "#94A3B8",
};

export const semaforoLabel: Record<Semaforo, string> = {
  verde: "En tiempo",
  amarillo: "Retraso leve",
  rojo: "Retraso crítico",
  gris: "Sin iniciar",
};
