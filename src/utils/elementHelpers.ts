import type { Objetivo, Actividad } from "../types";
import { calcularSemaforo } from "./semaforo";
import { avanceEsperado, diasRestantes } from "./dates";

type ElementoBase = Pick<Objetivo | Actividad, "fechaInicio" | "fechaFin" | "estatus" | "avanceCalculado">;

export function semaforoDe(el: ElementoBase) {
  return calcularSemaforo(el.avanceCalculado, el.fechaInicio, el.fechaFin, el.estatus);
}

export function esperadoDe(el: ElementoBase): number {
  return avanceEsperado(el.fechaInicio, el.fechaFin);
}

export function desviacionDe(el: ElementoBase): number {
  return Math.round(el.avanceCalculado - esperadoDe(el));
}

export function diasRestantesDe(el: Pick<Objetivo | Actividad, "fechaFin">): number {
  return diasRestantes(el.fechaFin);
}

export function esHijoDeObjetivo(objetivos: Objetivo[], actividades: Actividad[], objetivoId: string): (Objetivo | Actividad)[] {
  const hijosObjetivo = objetivos.filter((o) => o.parentId === objetivoId);
  const hijosActividad = actividades.filter((a) => a.objetivoId === objetivoId && a.parentId === null);
  return [...hijosObjetivo, ...hijosActividad];
}
