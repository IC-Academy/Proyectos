import type {
  Actividad,
  Aprobacion,
  Area,
  Comentario,
  DemoDatabase,
  EstatusSolicitud,
  Evidencia,
  Notificacion,
  NodoCascada,
  Objetivo,
  ObjetivoArea,
  Periodo,
  PrioridadActividad,
  Proyecto,
  RolUsuario,
  SolicitudInterarea,
  TipoNotificacion,
  Usuario,
} from "../types";
import { loadDatabase, persistDatabase, resetDatabase } from "./storage";
import { diasRestantes, esHoja, recalcularAvancesActividades } from "./calc";

// ============================================================================
// STORE — capa de servicio local (equivalente a un "backend" en memoria).
// Todas las lecturas/escrituras de la demo pasan por aquí. Implementa un
// patrón de publicación/suscripción sencillo para que React re-renderice al
// cambiar el estado, y persiste automáticamente cada cambio en localStorage.
// ============================================================================

function genId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

function hoyIso(): string {
  return new Date().toISOString().slice(0, 10);
}

type Listener = () => void;

class DemoStore {
  private db: DemoDatabase;
  private listeners = new Set<Listener>();

  constructor() {
    const { db } = loadDatabase();
    recalcularAvancesActividades(db.actividades);
    this.db = db;
  }

  // -- Suscripción (React useSyncExternalStore) ---------------------------
  subscribe = (fn: Listener): (() => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };

  getSnapshot = (): DemoDatabase => this.db;

  private emit() {
    this.listeners.forEach((fn) => fn());
  }

  /** Aplica una mutación sobre una copia profunda, recalcula avances,
   * sincroniza alertas automáticas, persiste y notifica. */
  private update(mutator: (draft: DemoDatabase) => void) {
    const draft: DemoDatabase = deepClone(this.db);
    mutator(draft);
    recalcularAvancesActividades(draft.actividades);
    recalcularCascada(draft.nodosCascada);
    sincronizarAlertas(draft);
    this.db = draft;
    persistDatabase(draft);
    this.emit();
  }

  private log(usuarioId: string, accion: string, entidadTipo: string, entidadId: string, detalle: string, draft: DemoDatabase) {
    draft.bitacora.unshift({
      bitacoraId: genId("BIT"),
      usuarioId,
      accion,
      entidadTipo,
      entidadId,
      detalle,
      fecha: hoyIso(),
    });
  }

  private notificar(draft: DemoDatabase, usuarioId: string, tipo: TipoNotificacion, titulo: string, mensaje: string, entidadTipo: string, entidadId: string) {
    draft.notificaciones.unshift({
      notificacionId: genId("NOT"),
      usuarioId,
      tipo,
      titulo,
      mensaje,
      entidadTipo,
      entidadId,
      leida: false,
      fecha: hoyIso(),
    });
  }

  // =========================================================================
  // AUTENTICACIÓN
  // =========================================================================
  intentarLogin(correo: string, password: string): Usuario | null {
    const usuario = this.db.usuarios.find((u) => u.correo.toLowerCase() === correo.trim().toLowerCase() && u.passwordDemo === password);
    if (!usuario || !usuario.activo) return null;
    return usuario;
  }

  // =========================================================================
  // OBJETIVOS
  // =========================================================================
  crearObjetivo(
    input: Omit<Objetivo, "objetivoId" | "creadoPorId" | "fechaCreacion" | "estatus" | "smartDetalle">,
    areasConPonderacion: { areaId: string; ponderacion: number }[],
    creadoPorId: string
  ): string {
    const objetivoId = genId("OBJ");
    this.update((draft) => {
      draft.objetivos.push({
        ...input,
        objetivoId,
        creadoPorId,
        fechaCreacion: hoyIso(),
        estatus: "Activo",
        smartDetalle: null,
      });
      areasConPonderacion.forEach((a) => {
        draft.objetivoAreas.push({ objetivoAreaId: genId("OA"), objetivoId, areaId: a.areaId, ponderacion: a.ponderacion });
        const area = draft.areas.find((ar) => ar.areaId === a.areaId);
        if (area?.liderId) {
          this.notificar(draft, area.liderId, "Objetivo asignado", `Nuevo objetivo estratégico: ${input.nombreCorto}`, `Dirección asignó a tu área participación (${a.ponderacion}%) en "${input.nombreCorto}".`, "Objetivo", objetivoId);
        }
      });
      this.log(creadoPorId, "Creó el objetivo estratégico", "Objetivo", objetivoId, input.nombreCorto, draft);
    });
    return objetivoId;
  }

  actualizarObjetivo(objetivoId: string, patch: Partial<Objetivo>, usuarioId: string) {
    this.update((draft) => {
      const obj = draft.objetivos.find((o) => o.objetivoId === objetivoId);
      if (!obj) return;
      Object.assign(obj, patch);
      this.log(usuarioId, "Editó el objetivo", "Objetivo", objetivoId, obj.nombreCorto, draft);
    });
  }

  // =========================================================================
  // CASCADA ORGANIZACIONAL V2
  // =========================================================================
  proponerObjetivoCorporativo(input: Omit<NodoCascada, "nodoId" | "padreId" | "raizId" | "tipo" | "nivel" | "avance" | "asignadoPorId" | "creadoPorId" | "estatus" | "comentarioAprobacion" | "aprobadoPorId" | "fechaAprobacion" | "fechaCreacion">, creadoPorId: string): string {
    const nodoId = genId("NC");
    this.update((draft) => {
      const creador = draft.usuarios.find((u) => u.usuarioId === creadoPorId);
      if (!creador || (creador.rol !== "Direccion" && !creador.esSuperUsuario)) return;
      const aprobado = creador.rol === "Direccion";
      draft.nodosCascada.push({ ...input, nodoId, padreId: null, raizId: nodoId, tipo: "Objetivo", nivel: 0, avance: 0, asignadoPorId: creadoPorId, creadoPorId, estatus: aprobado ? "Aprobado" : "Pendiente Dirección", comentarioAprobacion: "", aprobadoPorId: aprobado ? creadoPorId : null, fechaAprobacion: aprobado ? hoyIso() : null, fechaCreacion: hoyIso() });
      draft.usuarios.filter((u) => u.rol === "Direccion").forEach((u) => this.notificar(draft, u.usuarioId, "Objetivo asignado", "Objetivo corporativo pendiente", `${creador.nombre} envió “${input.titulo}” para aprobación de Dirección.`, "Objetivo", nodoId));
      this.log(creadoPorId, aprobado ? "Creó objetivo corporativo" : "Envió objetivo a Dirección", "Objetivo", nodoId, input.titulo, draft);
    });
    return nodoId;
  }

  decidirObjetivoCorporativo(nodoId: string, decision: "Aprobado" | "Cambios solicitados" | "Rechazado", comentario: string, usuarioId: string) {
    this.update((draft) => {
      const usuario = draft.usuarios.find((u) => u.usuarioId === usuarioId);
      const nodo = draft.nodosCascada.find((n) => n.nodoId === nodoId && n.padreId === null);
      if (!usuario || usuario.rol !== "Direccion" || !nodo) return;
      nodo.estatus = decision;
      nodo.comentarioAprobacion = comentario;
      nodo.aprobadoPorId = decision === "Aprobado" ? usuarioId : null;
      nodo.fechaAprobacion = decision === "Aprobado" ? hoyIso() : null;
      this.notificar(draft, nodo.creadoPorId, decision === "Aprobado" ? "Solicitud aprobada" : "Cambios solicitados", `Dirección: ${decision}`, `${nodo.titulo}. ${comentario}`, "Objetivo", nodoId);
      this.log(usuarioId, `${decision} objetivo corporativo`, "Objetivo", nodoId, comentario || nodo.titulo, draft);
    });
  }

  asignarNodoCascada(padreId: string, input: Pick<NodoCascada, "tipo" | "titulo" | "descripcion" | "indicador" | "lineaBase" | "meta" | "unidad" | "fechaInicio" | "fechaFin" | "ponderacion" | "responsableId">, asignadoPorId: string): string | null {
    const nodoId = genId("NC");
    let creado = false;
    this.update((draft) => {
      const padre = draft.nodosCascada.find((n) => n.nodoId === padreId);
      const responsable = draft.usuarios.find((u) => u.usuarioId === input.responsableId);
      const esReporteDirecto = responsable?.liderId === asignadoPorId;
      if (!padre || !responsable || !esReporteDirecto || padre.estatus === "Pendiente Dirección" || padre.estatus === "Rechazado") return;
      draft.nodosCascada.push({ ...input, nodoId, padreId, raizId: padre.raizId, nivel: padre.nivel + 1, avance: 0, asignadoPorId, creadoPorId: asignadoPorId, estatus: "En ejecución", comentarioAprobacion: "", aprobadoPorId: asignadoPorId, fechaAprobacion: hoyIso(), fechaCreacion: hoyIso() });
      this.notificar(draft, input.responsableId, "Objetivo asignado", `Nuevo ${input.tipo.toLowerCase()}: ${input.titulo}`, "Tu responsable directo te asignó este compromiso dentro de la cascada.", input.tipo, nodoId);
      this.log(asignadoPorId, `Asignó ${input.tipo.toLowerCase()} a reporte directo`, input.tipo, nodoId, input.titulo, draft);
      creado = true;
    });
    return creado ? nodoId : null;
  }

  actualizarAvanceNodo(nodoId: string, avance: number, usuarioId: string) {
    this.update((draft) => {
      const nodo = draft.nodosCascada.find((n) => n.nodoId === nodoId);
      if (!nodo || nodo.responsableId !== usuarioId || draft.nodosCascada.some((n) => n.padreId === nodoId)) return;
      nodo.avance = Math.max(0, Math.min(100, Math.round(avance)));
      nodo.estatus = nodo.avance === 100 ? "Cumplido" : "En ejecución";
      this.log(usuarioId, "Actualizó avance de cascada", nodo.tipo, nodoId, `${nodo.avance}%`, draft);
    });
  }

  // =========================================================================
  // PROYECTOS (metas de área)
  // =========================================================================
  crearProyecto(input: Omit<Proyecto, "proyectoId" | "creadoPorId" | "fechaCreacion" | "estatus">, creadoPorId: string): string {
    const proyectoId = genId("PRY");
    this.update((draft) => {
      draft.proyectos.push({ ...input, proyectoId, creadoPorId, fechaCreacion: hoyIso(), estatus: "Activo" });
      this.log(creadoPorId, "Creó proyecto / meta de área", "Proyecto", proyectoId, input.nombre, draft);
    });
    return proyectoId;
  }

  actualizarProyecto(proyectoId: string, patch: Partial<Proyecto>, usuarioId: string) {
    this.update((draft) => {
      const p = draft.proyectos.find((x) => x.proyectoId === proyectoId);
      if (!p) return;
      Object.assign(p, patch);
      this.log(usuarioId, "Editó proyecto", "Proyecto", proyectoId, p.nombre, draft);
    });
  }

  // =========================================================================
  // ACTIVIDADES / SUBACTIVIDADES
  // =========================================================================
  crearActividad(
    input: Omit<Actividad, "actividadId" | "avance" | "creadoPorId" | "fechaCreacion" | "fechaUltimaActualizacion" | "bloqueada" | "motivoBloqueo" | "origenSolicitudId" | "edd">,
    creadoPorId: string
  ): string {
    const actividadId = genId("ACT");
    this.update((draft) => {
      draft.actividades.push({
        ...input,
        actividadId,
        avance: 0,
        bloqueada: false,
        motivoBloqueo: null,
        origenSolicitudId: null,
        creadoPorId,
        fechaCreacion: hoyIso(),
        fechaUltimaActualizacion: hoyIso(),
        edd: {
          periodoId: "PER-2025-2026",
          cicloEvaluacionId: "EDD-2025-2026",
          empleadoId: input.responsableId,
          liderId: creadoPorId,
          objetivoId: draft.proyectos.find((p) => p.proyectoId === input.proyectoId)?.objetivoId ?? "",
          proyectoId: input.proyectoId,
          actividadId,
          indicador: input.indicador,
          lineaBase: null,
          meta: null,
          unidad: "",
          ponderacionEdd: 0,
          avanceFinal: null,
          cumplimientoCalculado: null,
          evidencias: 0,
          validadoPorLider: false,
          fechaValidacion: null,
          estatusIntegracionEdd: "Pendiente de ciclo",
        },
      });
      if (input.responsableId !== creadoPorId) {
        this.notificar(draft, input.responsableId, "Nueva actividad asignada", `Nueva actividad: ${input.nombre}`, `Se te asignó una actividad dentro de "${input.nombre}".`, "Actividad", actividadId);
      }
      this.log(creadoPorId, input.actividadPadreId ? "Creó subactividad" : "Asignó actividad", "Actividad", actividadId, input.nombre, draft);
    });
    return actividadId;
  }

  actualizarAvance(actividadId: string, nuevoAvance: number, usuarioId: string) {
    this.update((draft) => {
      const a = draft.actividades.find((x) => x.actividadId === actividadId);
      if (!a) return;
      if (!esHoja(actividadId, draft.actividades)) return; // el avance de contenedores es calculado
      const avance = Math.max(0, Math.min(100, Math.round(nuevoAvance)));
      a.avance = avance;
      a.fechaUltimaActualizacion = hoyIso();
      if (avance >= 100) {
        a.estado = "Completada";
        a.bloqueada = false;
        a.motivoBloqueo = null;
      } else if (a.estado === "Completada" || a.estado === "Pendiente") {
        a.estado = "En progreso";
      }
      this.log(usuarioId, "Actualizó avance", "Actividad", actividadId, `Avance actualizado a ${avance}%.`, draft);
    });
  }

  editarActividad(actividadId: string, patch: Partial<Actividad>, usuarioId: string) {
    this.update((draft) => {
      const a = draft.actividades.find((x) => x.actividadId === actividadId);
      if (!a) return;
      Object.assign(a, patch, { fechaUltimaActualizacion: hoyIso() });
      this.log(usuarioId, "Editó actividad", "Actividad", actividadId, a.nombre, draft);
    });
  }

  reportarBloqueo(actividadId: string, motivo: string, usuarioId: string) {
    this.update((draft) => {
      const a = draft.actividades.find((x) => x.actividadId === actividadId);
      if (!a) return;
      a.estado = "Bloqueada";
      a.bloqueada = true;
      a.motivoBloqueo = motivo;
      a.fechaUltimaActualizacion = hoyIso();
      const responsable = draft.usuarios.find((u) => u.usuarioId === a.responsableId);
      if (responsable?.liderId) {
        this.notificar(draft, responsable.liderId, "Bloqueo reportado", `Bloqueo en: ${a.nombre}`, `${responsable.nombre} reportó un bloqueo: ${motivo}`, "Actividad", actividadId);
      }
      this.log(usuarioId, "Reportó bloqueo", "Actividad", actividadId, motivo, draft);
    });
  }

  desbloquear(actividadId: string, usuarioId: string) {
    this.update((draft) => {
      const a = draft.actividades.find((x) => x.actividadId === actividadId);
      if (!a) return;
      a.estado = "En progreso";
      a.bloqueada = false;
      a.motivoBloqueo = null;
      a.fechaUltimaActualizacion = hoyIso();
      this.log(usuarioId, "Liberó bloqueo", "Actividad", actividadId, a.nombre, draft);
    });
  }

  eliminarActividad(actividadId: string, usuarioId: string): boolean {
    let ok = false;
    this.update((draft) => {
      const tieneHijos = draft.actividades.some((a) => a.actividadPadreId === actividadId);
      const a = draft.actividades.find((x) => x.actividadId === actividadId);
      if (!a || tieneHijos || a.origenSolicitudId) return;
      draft.actividades = draft.actividades.filter((x) => x.actividadId !== actividadId);
      this.log(usuarioId, "Eliminó actividad", "Actividad", actividadId, a.nombre, draft);
      ok = true;
    });
    return ok;
  }

  // =========================================================================
  // EVIDENCIAS Y COMENTARIOS
  // =========================================================================
  agregarEvidencia(actividadId: string, datos: { nombreArchivo: string; tipo: string; tamanioKB: number; comentario: string }, usuarioId: string) {
    this.update((draft) => {
      const evidenciaId = genId("EVI");
      draft.evidencias.push({ evidenciaId, actividadId, ...datos, fecha: hoyIso(), subidoPorId: usuarioId, validada: false });
      const a = draft.actividades.find((x) => x.actividadId === actividadId);
      const responsable = draft.usuarios.find((u) => u.usuarioId === usuarioId);
      if (a && responsable?.liderId) {
        this.notificar(draft, responsable.liderId, "Evidencia pendiente", `Nueva evidencia en: ${a.nombre}`, `${responsable.nombre} adjuntó "${datos.nombreArchivo}", pendiente de validar.`, "Actividad", actividadId);
      }
      this.log(usuarioId, "Adjuntó evidencia", "Actividad", actividadId, datos.nombreArchivo, draft);
    });
  }

  validarEvidencia(evidenciaId: string, usuarioId: string) {
    this.update((draft) => {
      const e = draft.evidencias.find((x) => x.evidenciaId === evidenciaId);
      if (!e) return;
      e.validada = true;
      this.log(usuarioId, "Validó evidencia", "Evidencia", evidenciaId, e.nombreArchivo, draft);
    });
  }

  agregarComentario(entidadTipo: Comentario["entidadTipo"], entidadId: string, texto: string, autorId: string) {
    this.update((draft) => {
      draft.comentarios.push({ comentarioId: genId("COM"), entidadTipo, entidadId, autorId, texto, fecha: hoyIso() });
      this.log(autorId, "Agregó comentario", entidadTipo, entidadId, texto.slice(0, 120), draft);
    });
  }

  // =========================================================================
  // SOLICITUDES INTERÁREA
  // =========================================================================
  crearSolicitud(
    input: {
      objetivoId: string;
      proyectoId: string;
      actividadOrigenId: string;
      areaSolicitanteId: string;
      personaRequeridaId: string;
      areaRequeridaId: string;
      descripcionActividad: string;
      fechaInicio: string;
      fechaFin: string;
      prioridad: PrioridadActividad;
      cargaEstimadaHrs: number;
      justificacion: string;
      dependencias: string;
    },
    solicitanteId: string
  ): string {
    const solicitudId = genId("SOL");
    this.update((draft) => {
      const areaSolicitante = draft.areas.find((a) => a.areaId === input.areaSolicitanteId);
      const areaRequerida = draft.areas.find((a) => a.areaId === input.areaRequeridaId);
      const solicitante = draft.usuarios.find((u) => u.usuarioId === solicitanteId)!;
      const liderSolicitanteId = areaSolicitante?.liderId === solicitanteId ? solicitanteId : solicitante.liderId ?? solicitanteId;
      const liderAreaRequeridaId = areaRequerida?.liderId ?? input.personaRequeridaId;
      const solicitanteEsLiderPropio = areaSolicitante?.liderId === solicitanteId;
      const estatusInicial: EstatusSolicitud = solicitanteEsLiderPropio ? "Pendiente del líder del área requerida" : "Pendiente del líder solicitante";

      draft.solicitudes.push({
        solicitudId,
        ...input,
        solicitanteId,
        liderSolicitanteId,
        liderAreaRequeridaId,
        estatus: estatusInicial,
        actividadCreadaId: null,
        motivoRechazo: null,
        fechaCreacion: hoyIso(),
        fechaActualizacion: hoyIso(),
      });

      if (estatusInicial === "Pendiente del líder solicitante") {
        this.notificar(draft, liderSolicitanteId, "Solicitud interárea recibida", "Nueva solicitud de apoyo interárea", `${solicitante.nombre} solicita apoyo de ${draft.usuarios.find((u) => u.usuarioId === input.personaRequeridaId)?.nombre}.`, "Solicitud", solicitudId);
      } else {
        this.notificar(draft, liderAreaRequeridaId, "Solicitud interárea recibida", "Nueva solicitud de apoyo interárea", `${solicitante.nombre} solicita asignar a ${draft.usuarios.find((u) => u.usuarioId === input.personaRequeridaId)?.nombre} la actividad "${input.descripcionActividad}".`, "Solicitud", solicitudId);
      }
      this.log(solicitanteId, "Creó solicitud interárea", "Solicitud", solicitudId, input.descripcionActividad, draft);
    });
    return solicitudId;
  }

  aprobarComoSolicitante(solicitudId: string, aprobadorId: string, comentario: string) {
    this.update((draft) => {
      const s = draft.solicitudes.find((x) => x.solicitudId === solicitudId);
      if (!s || s.estatus !== "Pendiente del líder solicitante") return;
      s.estatus = "Pendiente del líder del área requerida";
      s.fechaActualizacion = hoyIso();
      draft.aprobaciones.push({ aprobacionId: genId("APR"), solicitudId, aprobadorId, rolAprobador: "Líder solicitante", decision: "Aceptada", comentario, fecha: hoyIso() });
      this.notificar(draft, s.liderAreaRequeridaId, "Solicitud interárea recibida", "Solicitud lista para tu revisión", `La solicitud "${s.descripcionActividad}" fue validada por el líder solicitante y espera tu decisión.`, "Solicitud", solicitudId);
      this.log(aprobadorId, "Aprobó solicitud (líder solicitante)", "Solicitud", solicitudId, comentario || "Sin comentarios.", draft);
    });
  }

  aprobarComoAreaRequerida(solicitudId: string, aprobadorId: string, comentario: string) {
    this.update((draft) => {
      const s = draft.solicitudes.find((x) => x.solicitudId === solicitudId);
      if (!s || s.estatus !== "Pendiente del líder del área requerida") return;
      const origen = draft.actividades.find((a) => a.actividadId === s.actividadOrigenId);
      const actividadId = genId("ACT");
      draft.actividades.push({
        actividadId,
        proyectoId: s.proyectoId,
        actividadPadreId: s.actividadOrigenId,
        nombre: s.descripcionActividad,
        descripcion: `Actividad generada por aprobación de solicitud interárea. Justificación original: ${s.justificacion}`,
        responsableId: s.personaRequeridaId,
        areaResponsableId: s.areaRequeridaId,
        fechaInicio: s.fechaInicio,
        fechaFin: s.fechaFin,
        prioridad: s.prioridad,
        ponderacion: 100,
        indicador: origen?.indicador ?? "",
        meta: origen?.meta ?? "",
        evidenciaEsperada: "Evidencia de cierre de la actividad de apoyo.",
        dependeDeActividadId: null,
        comentariosTexto: "",
        requiereApoyoInterarea: false,
        avance: 0,
        estado: "Pendiente",
        bloqueada: false,
        motivoBloqueo: null,
        origenSolicitudId: solicitudId,
        creadoPorId: aprobadorId,
        fechaCreacion: hoyIso(),
        fechaUltimaActualizacion: hoyIso(),
        edd: {
          periodoId: "PER-2025-2026",
          cicloEvaluacionId: "EDD-2025-2026",
          empleadoId: s.personaRequeridaId,
          liderId: aprobadorId,
          objetivoId: s.objetivoId,
          proyectoId: s.proyectoId,
          actividadId,
          indicador: origen?.indicador ?? "",
          lineaBase: null,
          meta: null,
          unidad: "",
          ponderacionEdd: 0,
          avanceFinal: null,
          cumplimientoCalculado: null,
          evidencias: 0,
          validadoPorLider: false,
          fechaValidacion: null,
          estatusIntegracionEdd: "Pendiente de ciclo",
        },
      });
      s.estatus = "Aceptada";
      s.actividadCreadaId = actividadId;
      s.fechaActualizacion = hoyIso();
      draft.aprobaciones.push({ aprobacionId: genId("APR"), solicitudId, aprobadorId, rolAprobador: "Líder área requerida", decision: "Aceptada", comentario, fecha: hoyIso() });
      this.notificar(draft, s.personaRequeridaId, "Nueva actividad asignada", `Nueva actividad: ${s.descripcionActividad}`, "Se te asignó una actividad aprobada por solicitud interárea.", "Actividad", actividadId);
      this.notificar(draft, s.solicitanteId, "Solicitud aprobada", "Tu solicitud de apoyo fue aprobada", `${draft.usuarios.find((u) => u.usuarioId === aprobadorId)?.nombre} aprobó la solicitud y creó la actividad para ${draft.usuarios.find((u) => u.usuarioId === s.personaRequeridaId)?.nombre}.`, "Solicitud", solicitudId);
      this.log(aprobadorId, "Aprobó solicitud (líder área requerida)", "Solicitud", solicitudId, "Actividad creada y asignada.", draft);
    });
  }

  rechazarSolicitud(solicitudId: string, aprobadorId: string, motivo: string, rolAprobador: Aprobacion["rolAprobador"]) {
    this.update((draft) => {
      const s = draft.solicitudes.find((x) => x.solicitudId === solicitudId);
      if (!s) return;
      s.estatus = "Rechazada";
      s.motivoRechazo = motivo;
      s.fechaActualizacion = hoyIso();
      draft.aprobaciones.push({ aprobacionId: genId("APR"), solicitudId, aprobadorId, rolAprobador, decision: "Rechazada", comentario: motivo, fecha: hoyIso() });
      this.notificar(draft, s.solicitanteId, "Solicitud rechazada", "Tu solicitud de apoyo fue rechazada", motivo || "Sin motivo adicional especificado.", "Solicitud", solicitudId);
      this.log(aprobadorId, "Rechazó solicitud", "Solicitud", solicitudId, motivo, draft);
    });
  }

  solicitarCambios(solicitudId: string, aprobadorId: string, comentario: string, rolAprobador: Aprobacion["rolAprobador"]) {
    this.update((draft) => {
      const s = draft.solicitudes.find((x) => x.solicitudId === solicitudId);
      if (!s) return;
      s.estatus = "Cambios solicitados";
      s.fechaActualizacion = hoyIso();
      draft.aprobaciones.push({ aprobacionId: genId("APR"), solicitudId, aprobadorId, rolAprobador, decision: "Cambios solicitados", comentario, fecha: hoyIso() });
      this.notificar(draft, s.solicitanteId, "Cambios solicitados", "Se solicitaron cambios a tu solicitud", comentario, "Solicitud", solicitudId);
      this.log(aprobadorId, "Solicitó cambios", "Solicitud", solicitudId, comentario, draft);
    });
  }

  reenviarSolicitud(solicitudId: string, patch: Partial<SolicitudInterarea>, usuarioId: string) {
    this.update((draft) => {
      const s = draft.solicitudes.find((x) => x.solicitudId === solicitudId);
      if (!s) return;
      Object.assign(s, patch);
      s.estatus = "Pendiente del líder solicitante";
      s.fechaActualizacion = hoyIso();
      this.notificar(draft, s.liderSolicitanteId, "Solicitud interárea recibida", "Solicitud reenviada con cambios", `${draft.usuarios.find((u) => u.usuarioId === usuarioId)?.nombre} actualizó y reenvió la solicitud.`, "Solicitud", solicitudId);
      this.log(usuarioId, "Reenvió solicitud con cambios", "Solicitud", solicitudId, "Solicitud actualizada tras cambios solicitados.", draft);
    });
  }

  cancelarSolicitud(solicitudId: string, usuarioId: string) {
    this.update((draft) => {
      const s = draft.solicitudes.find((x) => x.solicitudId === solicitudId);
      if (!s || s.estatus === "Aceptada") return;
      s.estatus = "Cancelada";
      s.fechaActualizacion = hoyIso();
      this.log(usuarioId, "Canceló solicitud", "Solicitud", solicitudId, s.descripcionActividad, draft);
    });
  }

  // =========================================================================
  // NOTIFICACIONES
  // =========================================================================
  marcarNotificacionLeida(notificacionId: string) {
    this.update((draft) => {
      const n = draft.notificaciones.find((x) => x.notificacionId === notificacionId);
      if (n) n.leida = true;
    });
  }

  marcarTodasLeidas(usuarioId: string) {
    this.update((draft) => {
      draft.notificaciones.filter((n) => n.usuarioId === usuarioId).forEach((n) => (n.leida = true));
    });
  }

  // =========================================================================
  // ADMINISTRACIÓN — usuarios, áreas, periodos, EDD
  // =========================================================================
  crearUsuario(input: Omit<Usuario, "usuarioId">, adminId: string): string {
    const usuarioId = genId("U");
    this.update((draft) => {
      draft.usuarios.push({ ...input, usuarioId });
      if (input.liderId) {
        const lider = draft.usuarios.find((u) => u.usuarioId === input.liderId);
        if (lider && !lider.personasACargo.includes(usuarioId)) lider.personasACargo.push(usuarioId);
      }
      this.log(adminId, "Creó usuario simulado", "Usuario", usuarioId, `${input.nombre} (${input.rol})`, draft);
    });
    return usuarioId;
  }

  actualizarUsuario(usuarioId: string, patch: Partial<Usuario>, adminId: string) {
    this.update((draft) => {
      const u = draft.usuarios.find((x) => x.usuarioId === usuarioId);
      if (!u) return;
      const liderAnterior = u.liderId;
      Object.assign(u, patch);
      if (patch.liderId !== undefined && patch.liderId !== liderAnterior) {
        if (liderAnterior) {
          const antiguo = draft.usuarios.find((x) => x.usuarioId === liderAnterior);
          if (antiguo) antiguo.personasACargo = antiguo.personasACargo.filter((id) => id !== usuarioId);
        }
        if (patch.liderId) {
          const nuevo = draft.usuarios.find((x) => x.usuarioId === patch.liderId);
          if (nuevo && !nuevo.personasACargo.includes(usuarioId)) nuevo.personasACargo.push(usuarioId);
          u.nombreLider = draft.usuarios.find((x) => x.usuarioId === patch.liderId)?.nombre ?? null;
        } else {
          u.nombreLider = null;
        }
      }
      this.log(adminId, "Actualizó usuario", "Usuario", usuarioId, `Cambios: ${Object.keys(patch).join(", ")}`, draft);
    });
  }

  actualizarArea(areaId: string, patch: Partial<Area>, adminId: string) {
    this.update((draft) => {
      const a = draft.areas.find((x) => x.areaId === areaId);
      if (!a) return;
      Object.assign(a, patch);
      this.log(adminId, "Actualizó área", "Area", areaId, a.nombre, draft);
    });
  }

  crearPeriodo(input: Omit<Periodo, "periodoId">, adminId: string): string {
    const periodoId = genId("PER");
    this.update((draft) => {
      draft.periodos.push({ ...input, periodoId });
      this.log(adminId, "Creó periodo", "Periodo", periodoId, input.nombre, draft);
    });
    return periodoId;
  }

  actualizarPeriodo(periodoId: string, patch: Partial<Periodo>, adminId: string) {
    this.update((draft) => {
      const p = draft.periodos.find((x) => x.periodoId === periodoId);
      if (!p) return;
      Object.assign(p, patch);
      this.log(adminId, "Actualizó periodo", "Periodo", periodoId, p.nombre, draft);
    });
  }

  validarAvanceEddLider(actividadId: string, avanceFinal: number, justificacionDiferencia: string, liderId: string) {
    this.update((draft) => {
      const a = draft.actividades.find((x) => x.actividadId === actividadId);
      if (!a) return;
      a.edd.avanceFinal = avanceFinal;
      a.edd.cumplimientoCalculado = a.avance;
      a.edd.validadoPorLider = true;
      a.edd.fechaValidacion = hoyIso();
      a.edd.estatusIntegracionEdd = "Disponible para EDD";
      this.log(liderId, "Validó calificación EDD sugerida", "Actividad", actividadId, justificacionDiferencia || "Confirmó el avance calculado por el portal.", draft);
    });
  }

  restablecerDemo(usuarioId: string) {
    const fresh = resetDatabase();
    recalcularAvancesActividades(fresh.actividades);
    sincronizarAlertas(fresh);
    this.db = fresh;
    persistDatabase(fresh);
    this.log0(usuarioId);
    this.emit();
  }

  private log0(usuarioId: string) {
    this.db.bitacora.unshift({ bitacoraId: genId("BIT"), usuarioId, accion: "Restableció los datos de demostración", entidadTipo: "Sistema", entidadId: "-", detalle: "Se regeneraron los datos precargados.", fecha: hoyIso() });
  }
}

// ---------------------------------------------------------------------------
// Alertas automáticas: recorre el estado y genera notificaciones cuando
// corresponde, evitando duplicados (misma persona + tipo + entidad).
// ---------------------------------------------------------------------------
function sincronizarAlertas(draft: DemoDatabase) {
  const hoy = new Date();
  const existe = (usuarioId: string, tipo: TipoNotificacion, entidadId: string) => draft.notificaciones.some((n) => n.usuarioId === usuarioId && n.tipo === tipo && n.entidadId === entidadId);

  const agregar = (usuarioId: string, tipo: TipoNotificacion, titulo: string, mensaje: string, entidadTipo: string, entidadId: string) => {
    if (existe(usuarioId, tipo, entidadId)) return;
    draft.notificaciones.unshift({ notificacionId: genId("NOT"), usuarioId, tipo, titulo, mensaje, entidadTipo, entidadId, leida: false, fecha: hoyIso() });
  };

  draft.actividades
    .filter((a) => esHoja(a.actividadId, draft.actividades) && a.avance < 100)
    .forEach((a) => {
      const responsable = draft.usuarios.find((u) => u.usuarioId === a.responsableId);
      if (!responsable) return;
      const dias = diasRestantes(a.fechaFin, hoy);
      if (a.estado !== "Bloqueada" && dias < 0) {
        agregar(a.responsableId, "Actividad vencida", `Vencida: ${a.nombre}`, `La actividad venció hace ${Math.abs(dias)} día(s) y tiene ${a.avance}% de avance.`, "Actividad", a.actividadId);
        if (responsable.liderId) agregar(responsable.liderId, "Actividad vencida", `Vencida: ${a.nombre}`, `La actividad de ${responsable.nombre} venció hace ${Math.abs(dias)} día(s).`, "Actividad", a.actividadId);
      } else if (a.estado !== "Bloqueada" && dias >= 0 && dias <= 3) {
        agregar(a.responsableId, "Actividad próxima a vencer", `Por vencer: ${a.nombre}`, `Vence en ${dias} día(s) y tiene ${a.avance}% de avance.`, "Actividad", a.actividadId);
      }
      const diasSinActualizar = Math.floor((hoy.getTime() - new Date(a.fechaUltimaActualizacion).getTime()) / (1000 * 60 * 60 * 24));
      if (diasSinActualizar >= 12 && a.estado === "En progreso") {
        agregar(a.responsableId, "Avance sin actualizar", `Actualiza: ${a.nombre}`, `No has actualizado el avance en ${diasSinActualizar} días.`, "Actividad", a.actividadId);
      }
    });
}

function recalcularCascada(nodos: NodoCascada[]) {
  const visitar = (padreId: string, vistos: Set<string>): number => {
    if (vistos.has(padreId)) return 0;
    vistos.add(padreId);
    const padre = nodos.find((n) => n.nodoId === padreId);
    const hijos = nodos.filter((n) => n.padreId === padreId && n.estatus !== "Rechazado");
    if (!padre || hijos.length === 0) return padre?.avance ?? 0;
    const totalPeso = hijos.reduce((s, h) => s + Math.max(0, h.ponderacion), 0);
    const avance = hijos.reduce((s, h) => s + visitar(h.nodoId, vistos) * (totalPeso > 0 ? h.ponderacion / totalPeso : 1 / hijos.length), 0);
    padre.avance = Math.round(avance);
    if (padre.avance === 100) padre.estatus = "Cumplido";
    return padre.avance;
  };
  nodos.filter((n) => n.padreId === null).forEach((n) => visitar(n.nodoId, new Set()));
}

function deepClone<T>(value: T): T {
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

export const store = new DemoStore();
export type { DemoStore };
export type { RolUsuario, Usuario, Notificacion, Evidencia, Objetivo, ObjetivoArea, Proyecto, Actividad, SolicitudInterarea, Aprobacion, Area, Periodo };
