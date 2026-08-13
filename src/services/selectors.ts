import type { Actividad, Area, DemoDatabase, Objetivo, Proyecto, Usuario } from "../types";
import { avanceEsperadoPorFecha, avanceObjetivo, avanceProyecto, desviacion, diasRestantes, esHoja, estadoEfectivo, hijosDe, raicesDeProyecto, riesgoNodo } from "./calc";
import { detectarCuellosDeBotella } from "./bottleneck";

// ============================================================================
// SELECTORES — funciones de solo lectura, reutilizadas por todas las
// pantallas para consultar la misma fuente de datos con distinto alcance.
// ============================================================================

export function usuario(db: DemoDatabase, id: string | null | undefined): Usuario | undefined {
  if (!id) return undefined;
  return db.usuarios.find((u) => u.usuarioId === id);
}
export function nombreUsuario(db: DemoDatabase, id: string | null | undefined): string {
  return usuario(db, id)?.nombre ?? "—";
}
export function area(db: DemoDatabase, id: string | null | undefined): Area | undefined {
  if (!id) return undefined;
  return db.areas.find((a) => a.areaId === id);
}
export function nombreArea(db: DemoDatabase, id: string | null | undefined): string {
  return area(db, id)?.nombre ?? "—";
}
export function proyecto(db: DemoDatabase, id: string | null | undefined): Proyecto | undefined {
  if (!id) return undefined;
  return db.proyectos.find((p) => p.proyectoId === id);
}
export function objetivo(db: DemoDatabase, id: string | null | undefined): Objetivo | undefined {
  if (!id) return undefined;
  return db.objetivos.find((o) => o.objetivoId === id);
}
export function actividad(db: DemoDatabase, id: string | null | undefined): Actividad | undefined {
  if (!id) return undefined;
  return db.actividades.find((a) => a.actividadId === id);
}

/** Objetivos visibles según el alcance del rol/área del usuario autenticado. */
export function objetivosVisibles(db: DemoDatabase, u: Usuario): Objetivo[] {
  if (u.rol === "Administrador" || u.rol === "Direccion") return db.objetivos;
  if (u.rol === "Lider") {
    const ids = new Set(db.objetivoAreas.filter((oa) => oa.areaId === u.areaId).map((oa) => oa.objetivoId));
    return db.objetivos.filter((o) => ids.has(o.objetivoId));
  }
  // Colaborador: objetivos de los proyectos donde tiene actividades asignadas
  const proyectoIds = new Set(db.actividades.filter((a) => a.responsableId === u.usuarioId).map((a) => a.proyectoId));
  const objetivoIds = new Set(db.proyectos.filter((p) => proyectoIds.has(p.proyectoId)).map((p) => p.objetivoId));
  return db.objetivos.filter((o) => objetivoIds.has(o.objetivoId));
}

export function proyectosDeArea(db: DemoDatabase, areaId: string, objetivoId?: string): Proyecto[] {
  return db.proyectos.filter((p) => p.areaId === areaId && (!objetivoId || p.objetivoId === objetivoId));
}

export function misActividades(db: DemoDatabase, usuarioId: string): Actividad[] {
  return db.actividades.filter((a) => a.responsableId === usuarioId);
}

export function actividadesDeEquipo(db: DemoDatabase, lider: Usuario): Actividad[] {
  const ids = new Set(lider.personasACargo);
  return db.actividades.filter((a) => ids.has(a.responsableId));
}

export interface FilaKPI {
  actividadesTotales: number;
  completadas: number;
  enTiempo: number;
  porVencer: number;
  vencidas: number;
  bloqueadas: number;
}

export function kpisActividades(db: DemoDatabase, actividades: Actividad[], hoy: Date = new Date()): FilaKPI {
  const hojas = actividades.filter((a) => esHoja(a.actividadId, db.actividades));
  const kpi: FilaKPI = { actividadesTotales: hojas.length, completadas: 0, enTiempo: 0, porVencer: 0, vencidas: 0, bloqueadas: 0 };
  hojas.forEach((a) => {
    const est = estadoEfectivo(a, db.actividades, hoy);
    if (est === "Completada") kpi.completadas++;
    else if (est === "Bloqueada") kpi.bloqueadas++;
    else if (est === "Vencida") kpi.vencidas++;
    else if (est === "Por vencer") kpi.porVencer++;
    else kpi.enTiempo++;
  });
  return kpi;
}

export interface ResumenObjetivo {
  objetivo: Objetivo;
  avance: ReturnType<typeof avanceObjetivo>;
  avanceEsperado: number;
  desviacion: number;
  diasRestantes: number;
  kpis: FilaKPI;
  solicitudesPendientes: number;
  evidenciasPendientes: number;
  cuellos: ReturnType<typeof detectarCuellosDeBotella>;
  areaMayorCarga: { areaId: string; total: number } | null;
  areaMasRezagada: { areaId: string; avance: number } | null;
}

export function resumenObjetivo(db: DemoDatabase, objetivoId: string, hoy: Date = new Date()): ResumenObjetivo | null {
  const o = objetivo(db, objetivoId);
  if (!o) return null;
  const avance = avanceObjetivo(o, db);
  const avanceEsperado = avanceEsperadoPorFecha(o.fechaInicio, o.fechaFin, hoy);
  const proyectosDelObjetivo = db.proyectos.filter((p) => p.objetivoId === objetivoId);
  const proyectoIds = new Set(proyectosDelObjetivo.map((p) => p.proyectoId));
  const actividadesDelObjetivo = db.actividades.filter((a) => proyectoIds.has(a.proyectoId));
  const kpis = kpisActividades(db, actividadesDelObjetivo, hoy);
  const solicitudesPendientes = db.solicitudes.filter((s) => s.objetivoId === objetivoId && (s.estatus === "Pendiente del líder solicitante" || s.estatus === "Pendiente del líder del área requerida" || s.estatus === "Cambios solicitados")).length;
  const evidenciasPendientes = db.evidencias.filter((e) => {
    const act = actividadesDelObjetivo.find((a) => a.actividadId === e.actividadId);
    return act && !e.validada;
  }).length;
  const cuellos = detectarCuellosDeBotella(objetivoId, db, hoy);

  const cargaPorArea = new Map<string, number>();
  actividadesDelObjetivo.filter((a) => esHoja(a.actividadId, db.actividades)).forEach((a) => cargaPorArea.set(a.areaResponsableId, (cargaPorArea.get(a.areaResponsableId) ?? 0) + 1));
  let areaMayorCarga: { areaId: string; total: number } | null = null;
  cargaPorArea.forEach((total, areaId) => {
    if (!areaMayorCarga || total > areaMayorCarga.total) areaMayorCarga = { areaId, total };
  });

  let areaMasRezagada: { areaId: string; avance: number } | null = null;
  avance.porArea.forEach((pa) => {
    if (!areaMasRezagada || pa.avance.avance < areaMasRezagada.avance) areaMasRezagada = { areaId: pa.areaId, avance: pa.avance.avance };
  });

  return {
    objetivo: o,
    avance,
    avanceEsperado,
    desviacion: desviacion(avance.avance, avanceEsperado),
    diasRestantes: diasRestantes(o.fechaFin, hoy),
    kpis,
    solicitudesPendientes,
    evidenciasPendientes,
    cuellos,
    areaMayorCarga,
    areaMasRezagada,
  };
}

// ---------------------------------------------------------------------------
// Árbol de cascada: Objetivo -> Áreas -> Proyectos -> Actividades -> hijos
// ---------------------------------------------------------------------------
export type NodoCascadaTipo = "objetivo" | "area" | "proyecto" | "actividad";

export interface NodoCascada {
  tipo: NodoCascadaTipo;
  id: string;
  nombre: string;
  responsable: string;
  avance: number;
  avanceEsperado: number;
  estado: string;
  ponderacion: number;
  bloqueos: number;
  hijos: NodoCascada[];
}

export function construirCascada(db: DemoDatabase, objetivoId: string, hoy: Date = new Date()): NodoCascada | null {
  const o = objetivo(db, objetivoId);
  if (!o) return null;
  const avanceObj = avanceObjetivo(o, db);
  const relaciones = db.objetivoAreas.filter((oa) => oa.objetivoId === objetivoId);

  function nodoActividad(a: Actividad): NodoCascada {
    const hijos = hijosDe(db.actividades, a.actividadId).map(nodoActividad);
    const bloqueos = (a.estado === "Bloqueada" || a.bloqueada ? 1 : 0) + hijos.reduce((s, h) => s + h.bloqueos, 0);
    return {
      tipo: "actividad",
      id: a.actividadId,
      nombre: a.nombre,
      responsable: nombreUsuario(db, a.responsableId),
      avance: a.avance,
      avanceEsperado: avanceEsperadoPorFecha(a.fechaInicio, a.fechaFin, hoy),
      estado: estadoEfectivo(a, db.actividades, hoy),
      ponderacion: a.ponderacion,
      bloqueos,
      hijos,
    };
  }

  const nodosArea: NodoCascada[] = relaciones.map((oa) => {
    const proyectosArea = db.proyectos.filter((p) => p.areaId === oa.areaId && p.objetivoId === objetivoId);
    const hijosProyecto: NodoCascada[] = proyectosArea.map((p) => {
      const raices = raicesDeProyecto(db.actividades, p.proyectoId).map(nodoActividad);
      const bloqueosP = raices.reduce((s, h) => s + h.bloqueos, 0);
      return {
        tipo: "proyecto",
        id: p.proyectoId,
        nombre: p.nombre,
        responsable: nombreUsuario(db, p.responsableId),
        avance: avanceProyecto(p.proyectoId, db.actividades),
        avanceEsperado: avanceEsperadoPorFecha(p.fechaInicio, p.fechaFin, hoy),
        estado: "—",
        ponderacion: p.ponderacion,
        bloqueos: bloqueosP,
        hijos: raices,
      };
    });
    const avanceArea = avanceObj.porArea.find((x) => x.areaId === oa.areaId)?.avance.avance ?? 0;
    return {
      tipo: "area",
      id: oa.areaId,
      nombre: nombreArea(db, oa.areaId),
      responsable: nombreUsuario(db, area(db, oa.areaId)?.liderId),
      avance: avanceArea,
      avanceEsperado: avanceEsperadoPorFecha(o.fechaInicio, o.fechaFin, hoy),
      estado: "—",
      ponderacion: oa.ponderacion,
      bloqueos: hijosProyecto.reduce((s, h) => s + h.bloqueos, 0),
      hijos: hijosProyecto,
    };
  });

  return {
    tipo: "objetivo",
    id: o.objetivoId,
    nombre: o.nombreCorto,
    responsable: nombreUsuario(db, o.responsablePrincipalId),
    avance: avanceObj.avance,
    avanceEsperado: avanceEsperadoPorFecha(o.fechaInicio, o.fechaFin, hoy),
    estado: "—",
    ponderacion: 100,
    bloqueos: nodosArea.reduce((s, h) => s + h.bloqueos, 0),
    hijos: nodosArea,
  };
}

// ---------------------------------------------------------------------------
// Filas para el Gantt: aplanado con nivel, fechas y filtros aplicados fuera
// ---------------------------------------------------------------------------
export interface FilaGantt {
  id: string;
  nivel: number;
  tipo: "objetivo" | "proyecto" | "actividad";
  nombre: string;
  responsable: string;
  areaId: string | null;
  fechaInicio: string;
  fechaFin: string;
  avance: number;
  estado: string;
  prioridad: string | null;
  objetivoId: string;
  padreVisualId: string | null;
}

export function filasGantt(db: DemoDatabase, hoy: Date = new Date()): FilaGantt[] {
  const filas: FilaGantt[] = [];
  db.objetivos.forEach((o) => {
    filas.push({ id: o.objetivoId, nivel: 0, tipo: "objetivo", nombre: o.nombreCorto, responsable: nombreUsuario(db, o.responsablePrincipalId), areaId: null, fechaInicio: o.fechaInicio, fechaFin: o.fechaFin, avance: avanceObjetivo(o, db).avance, estado: "—", prioridad: null, objetivoId: o.objetivoId, padreVisualId: null });
    db.proyectos.filter((p) => p.objetivoId === o.objetivoId).forEach((p) => {
      filas.push({ id: p.proyectoId, nivel: 1, tipo: "proyecto", nombre: p.nombre, responsable: nombreUsuario(db, p.responsableId), areaId: p.areaId, fechaInicio: p.fechaInicio, fechaFin: p.fechaFin, avance: avanceProyecto(p.proyectoId, db.actividades), estado: "—", prioridad: null, objetivoId: o.objetivoId, padreVisualId: o.objetivoId });
      function agregarActividad(a: Actividad, padreVisualId: string, nivel: number) {
        filas.push({
          id: a.actividadId,
          nivel,
          tipo: "actividad",
          nombre: a.nombre,
          responsable: nombreUsuario(db, a.responsableId),
          areaId: a.areaResponsableId,
          fechaInicio: a.fechaInicio,
          fechaFin: a.fechaFin,
          avance: a.avance,
          estado: estadoEfectivo(a, db.actividades, hoy),
          prioridad: a.prioridad,
          objetivoId: o.objetivoId,
          padreVisualId,
        });
        hijosDe(db.actividades, a.actividadId).forEach((h) => agregarActividad(h, a.actividadId, nivel + 1));
      }
      raicesDeProyecto(db.actividades, p.proyectoId).forEach((a) => agregarActividad(a, p.proyectoId, 2));
    });
  });
  return filas;
}

export { riesgoNodo, estadoEfectivo };
