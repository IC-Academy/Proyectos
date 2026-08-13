import type { Actividad, DemoDatabase, Objetivo, Proyecto } from "../types";

// ============================================================================
// MOTOR DE CÁLCULO DE AVANCE — el avance del objetivo NUNCA se captura a
// mano: siempre se deriva de abajo hacia arriba usando ponderaciones.
//   Subactividades -> Actividad -> Proyecto (meta de área) -> Objetivo
// ============================================================================

const EPS = 0.6; // tolerancia (%) para considerar que las ponderaciones suman 100

export function hijosDe(actividades: Actividad[], padreId: string): Actividad[] {
  return actividades.filter((a) => a.actividadPadreId === padreId);
}

export function esHoja(actividadId: string, actividades: Actividad[]): boolean {
  return !actividades.some((a) => a.actividadPadreId === actividadId);
}

export function raicesDeProyecto(actividades: Actividad[], proyectoId: string): Actividad[] {
  return actividades.filter((a) => a.proyectoId === proyectoId && a.actividadPadreId === null);
}

export function todosLosDescendientes(actividades: Actividad[], actividadId: string): Actividad[] {
  const directos = hijosDe(actividades, actividadId);
  return directos.reduce<Actividad[]>((acc, hijo) => {
    acc.push(hijo);
    acc.push(...todosLosDescendientes(actividades, hijo.actividadId));
    return acc;
  }, []);
}

/** Promedio ponderado de una lista de nodos con {avance, ponderacion}. Normaliza si no suman 100. */
export function promedioPonderado(items: { avance: number; ponderacion: number }[]): number {
  if (items.length === 0) return 0;
  const sumaPeso = items.reduce((s, i) => s + Math.max(0, i.ponderacion), 0);
  if (sumaPeso <= 0) {
    // Sin ponderaciones capturadas: se reparte equitativamente.
    const eq = items.reduce((s, i) => s + i.avance, 0) / items.length;
    return round1(eq);
  }
  const total = items.reduce((s, i) => s + Math.max(0, i.ponderacion) * i.avance, 0);
  return round1(total / sumaPeso);
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/**
 * Recalcula, en el arreglo completo de actividades, el avance de todo nodo
 * que tenga hijos (subactividades). Los nodos hoja conservan el avance que
 * capturó su responsable. Muta el arreglo en su lugar (bottom-up vía
 * memoización recursiva) y regresa el mismo arreglo por conveniencia.
 */
export function recalcularAvancesActividades(actividades: Actividad[]): Actividad[] {
  const porId = new Map(actividades.map((a) => [a.actividadId, a]));
  const visitando = new Set<string>();
  const resuelto = new Set<string>();

  function resolver(id: string): number {
    if (resuelto.has(id)) return porId.get(id)!.avance;
    const nodo = porId.get(id);
    if (!nodo) return 0;
    if (visitando.has(id)) return nodo.avance; // corta ciclos accidentales
    visitando.add(id);
    const hijos = hijosDe(actividades, id);
    if (hijos.length > 0) {
      const items = hijos.map((h) => ({ avance: resolver(h.actividadId), ponderacion: h.ponderacion }));
      nodo.avance = promedioPonderado(items);
    }
    visitando.delete(id);
    resuelto.add(id);
    return nodo.avance;
  }

  actividades.forEach((a) => resolver(a.actividadId));
  return actividades;
}

export function avanceProyecto(proyectoId: string, actividades: Actividad[]): number {
  const raices = raicesDeProyecto(actividades, proyectoId);
  return promedioPonderado(raices.map((r) => ({ avance: r.avance, ponderacion: r.ponderacion })));
}

export interface AvanceArea {
  avance: number;
  sumaPonderacion: number;
  advertencia: boolean;
  proyectos: { proyecto: Proyecto; avance: number }[];
}

export function avanceArea(areaId: string, objetivoId: string, proyectos: Proyecto[], actividades: Actividad[]): AvanceArea {
  const propios = proyectos.filter((p) => p.areaId === areaId && p.objetivoId === objetivoId);
  const items = propios.map((p) => ({ proyecto: p, avance: avanceProyecto(p.proyectoId, actividades) }));
  const suma = propios.reduce((s, p) => s + p.ponderacion, 0);
  return {
    avance: promedioPonderado(items.map((i) => ({ avance: i.avance, ponderacion: i.proyecto.ponderacion }))),
    sumaPonderacion: suma,
    advertencia: propios.length > 0 && Math.abs(suma - 100) > EPS,
    proyectos: items,
  };
}

export interface AvanceObjetivo {
  avance: number;
  porArea: { areaId: string; ponderacion: number; avance: AvanceArea }[];
  sumaPonderacionAreas: number;
  advertenciaPonderacionAreas: boolean;
}

export function avanceObjetivo(objetivo: Objetivo, db: Pick<DemoDatabase, "objetivoAreas" | "proyectos" | "actividades">): AvanceObjetivo {
  const relaciones = db.objetivoAreas.filter((oa) => oa.objetivoId === objetivo.objetivoId);
  const porArea = relaciones.map((oa) => ({
    areaId: oa.areaId,
    ponderacion: oa.ponderacion,
    avance: avanceArea(oa.areaId, objetivo.objetivoId, db.proyectos, db.actividades),
  }));
  const sumaPonderacionAreas = relaciones.reduce((s, r) => s + r.ponderacion, 0);
  const avance = promedioPonderado(porArea.map((a) => ({ avance: a.avance.avance, ponderacion: a.ponderacion })));
  return {
    avance,
    porArea,
    sumaPonderacionAreas,
    advertenciaPonderacionAreas: relaciones.length > 0 && Math.abs(sumaPonderacionAreas - 100) > EPS,
  };
}

// ---------------------------------------------------------------------------
// Tiempo: avance esperado, desviación, días restantes, estado por fecha
// ---------------------------------------------------------------------------
export function avanceEsperadoPorFecha(fechaInicio: string, fechaFin: string, hoy: Date = new Date()): number {
  const ini = new Date(fechaInicio).getTime();
  const fin = new Date(fechaFin).getTime();
  const ahora = hoy.getTime();
  if (fin <= ini) return 100;
  if (ahora <= ini) return 0;
  if (ahora >= fin) return 100;
  return round1(((ahora - ini) / (fin - ini)) * 100);
}

export function diasRestantes(fechaFin: string, hoy: Date = new Date()): number {
  const fin = new Date(fechaFin).getTime();
  const ms = fin - hoy.getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

export function desviacion(avanceReal: number, avanceEsperado: number): number {
  return round1(avanceReal - avanceEsperado);
}

export type EstadoTiempo = "Completada" | "Bloqueada" | "Vencida" | "Por vencer" | "En tiempo" | "Pendiente de aprobación" | "Pendiente";

/** Estado visual efectivo de un nodo, combinando su estado capturado, el de
 * sus descendientes (si tiene hijos bloqueados) y la relación con la fecha. */
export function estadoEfectivo(actividad: Actividad, actividades: Actividad[], hoy: Date = new Date()): EstadoTiempo {
  if (actividad.estado === "Pendiente de aprobación") return "Pendiente de aprobación";
  if (actividad.avance >= 100 || actividad.estado === "Completada") return "Completada";
  if (actividad.estado === "Bloqueada" || tieneDescendienteBloqueado(actividad.actividadId, actividades)) return "Bloqueada";
  const dias = diasRestantes(actividad.fechaFin, hoy);
  if (dias < 0) return "Vencida";
  if (dias <= 7) return "Por vencer";
  if (actividad.estado === "Pendiente") return "Pendiente";
  return "En tiempo";
}

export function tieneDescendienteBloqueado(actividadId: string, actividades: Actividad[]): boolean {
  return todosLosDescendientes(actividades, actividadId).some((d) => d.estado === "Bloqueada" || d.bloqueada);
}

// ---------------------------------------------------------------------------
// Validación de ponderaciones entre hermanos
// ---------------------------------------------------------------------------
export function validarPonderaciones(items: { ponderacion: number }[]): { suma: number; ok: boolean } {
  if (items.length === 0) return { suma: 0, ok: true };
  const suma = items.reduce((s, i) => s + i.ponderacion, 0);
  return { suma: round1(suma), ok: Math.abs(suma - 100) <= EPS };
}

// ---------------------------------------------------------------------------
// Semáforo de riesgo por nodo (usado en dashboard, cascada y gantt)
// ---------------------------------------------------------------------------
export type NivelRiesgo = "bajo" | "medio" | "alto";

export function riesgoNodo(avanceReal: number, avanceEsperado: number, bloqueada: boolean, vencida: boolean): NivelRiesgo {
  const desv = avanceReal - avanceEsperado;
  if (bloqueada || vencida || desv <= -20) return "alto";
  if (desv <= -8) return "medio";
  return "bajo";
}
