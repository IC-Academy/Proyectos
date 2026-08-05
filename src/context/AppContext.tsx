import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type {
  Usuario,
  Objetivo,
  Actividad,
  Actualizacion,
  Delegacion,
  Evidencia,
  Bloqueo,
  SolicitudCambio,
  HistorialEvento,
  Alerta,
  AccionHistorial,
  TipoEvidencia,
  TipoBloqueo,
  UrgenciaBloqueo,
  TipoSolicitudCambio,
  Prioridad,
  Area,
} from "../types";
import {
  usuariosService,
  objetivosService,
  actividadesService,
  actualizacionesService,
  delegacionesService,
  evidenciasService,
  bloqueosService,
  solicitudesCambioService,
  historialService,
  alertasService,
  sesionService,
  restablecerDatosDemo,
} from "../services";
import { recalcularCascada } from "../utils/cascade";
import { generarAlertas, alertaVisiblePara } from "../utils/alertsEngine";
import { nowIso, todayIso } from "../utils/dates";

export interface Toast {
  id: string;
  tipo: "success" | "error" | "info" | "warning";
  mensaje: string;
}

interface AppState {
  cargando: boolean;
  usuarioActual: Usuario | null;
  usuarios: Usuario[];
  objetivos: Objetivo[];
  actividades: Actividad[];
  actualizaciones: Actualizacion[];
  delegaciones: Delegacion[];
  evidencias: Evidencia[];
  bloqueos: Bloqueo[];
  solicitudesCambio: SolicitudCambio[];
  historial: HistorialEvento[];
  advertenciasPeso: ReturnType<typeof recalcularCascada>["advertenciasPeso"];
  alertas: Alerta[];
  alertasLeidasIds: string[];
  toasts: Toast[];
}

interface NuevoObjetivoInput {
  parentId: string | null;
  nivel: 1 | 2 | 3;
  nombre: string;
  descripcion: string;
  responsableId: string;
  participantesIds: string[];
  area: Area;
  fechaInicio: string;
  fechaFin: string;
  prioridad: Prioridad;
  indicador: string;
  valorBase: number;
  meta: number;
  unidad: string;
  peso: number;
  criterioExito?: string;
  creadoPor: string;
}

interface NuevaActividadInput {
  parentId: string | null;
  objetivoId: string;
  nivel: 4 | 5;
  nombre: string;
  descripcion: string;
  responsablePropietarioId: string;
  fechaInicio: string;
  fechaFin: string;
  peso: number;
  prioridad: Prioridad;
  dependencia?: string;
  entregableEsperado?: string;
  evidenciaRequerida: boolean;
  creadoPor: string;
}

interface AppContextValue extends AppState {
  login: (usuarioId: string) => void;
  logout: () => void;
  crearObjetivo: (input: NuevoObjetivoInput) => Objetivo;
  crearActividad: (input: NuevaActividadInput) => Actividad;
  actualizarAvance: (
    elementoId: string,
    tipoElemento: "objetivo" | "actividad",
    nuevoAvance: number,
    comentario: string,
    usuarioId: string,
    evidenciaNombre?: string,
    nuevoEstatus?: Actividad["estatus"]
  ) => void;
  aprobarActualizacion: (actualizacionId: string, aprobadoPor: string) => void;
  rechazarActualizacion: (actualizacionId: string, aprobadoPor: string, motivo: string) => void;
  solicitarDelegacion: (
    actividadId: string,
    origenId: string,
    destinoId: string,
    motivo: string,
    fechaPropuesta: string,
    comentarios: string
  ) => void;
  aprobarDelegacion: (id: string, aprobadoPor: string) => void;
  rechazarDelegacion: (id: string, aprobadoPor: string) => void;
  cancelarDelegacion: (id: string) => void;
  reportarBloqueo: (input: {
    actividadId: string;
    tipo: TipoBloqueo;
    descripcion: string;
    impacto: string;
    apoyoRequerido: string;
    responsableAtenderId: string;
    urgencia: UrgenciaBloqueo;
    reportadoPor: string;
  }) => void;
  resolverBloqueo: (id: string) => void;
  agregarEvidencia: (input: {
    actividadId: string;
    nombreArchivo: string;
    tipoArchivo: TipoEvidencia;
    usuarioId: string;
    comentario?: string;
  }) => void;
  solicitarCambio: (input: {
    elementoId: string;
    tipoElemento: "objetivo" | "actividad";
    tipo: TipoSolicitudCambio;
    valorAnterior: string;
    valorSolicitado: string;
    motivo: string;
    solicitadoPor: string;
  }) => void;
  aprobarSolicitudCambio: (id: string, resueltoPor: string) => void;
  rechazarSolicitudCambio: (id: string, resueltoPor: string) => void;
  marcarAlertaLeida: (id: string) => void;
  marcarTodasAlertasLeidas: () => void;
  restablecerDatos: () => void;
  pushToast: (tipo: Toast["tipo"], mensaje: string) => void;
  dismissToast: (id: string) => void;
  alertasVisibles: Alerta[];
  getUsuario: (id?: string) => Usuario | undefined;
  getObjetivo: (id?: string) => Objetivo | undefined;
  getActividad: (id?: string) => Actividad | undefined;
  hijosDeUsuario: (liderId: string) => Usuario[];
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

function idAleatorio(prefijo: string): string {
  return `${prefijo}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>({
    cargando: true,
    usuarioActual: null,
    usuarios: [],
    objetivos: [],
    actividades: [],
    actualizaciones: [],
    delegaciones: [],
    evidencias: [],
    bloqueos: [],
    solicitudesCambio: [],
    historial: [],
    advertenciasPeso: [],
    alertas: [],
    alertasLeidasIds: [],
    toasts: [],
  });

  const cargarTodo = useCallback(() => {
    const usuarios = usuariosService.getAll();
    const objetivosRaw = objetivosService.getAll();
    const actividadesRaw = actividadesService.getAll();
    const { objetivos, actividades, advertenciasPeso } = recalcularCascada(objetivosRaw, actividadesRaw);
    objetivosService.replaceAll(objetivos);
    actividadesService.replaceAll(actividades);

    const actualizaciones = actualizacionesService.getAll();
    const delegaciones = delegacionesService.getAll();
    const evidencias = evidenciasService.getAll();
    const bloqueos = bloqueosService.getAll();
    const solicitudesCambio = solicitudesCambioService.getAll();
    let historial = historialService.getAll();

    // Generar historial de "Creación" la primera vez, si aún no existe.
    if (historial.length === 0) {
      const eventosObjetivos: HistorialEvento[] = objetivos.map((o) => ({
        id: idAleatorio("hist"),
        elementoId: o.id,
        tipoElemento: "objetivo",
        usuarioId: o.creadoPor,
        accion: "Creación",
        fecha: `${o.fechaCreacion}T09:00:00.000Z`,
        valorNuevo: o.nombre,
        comentario: `Elemento de nivel ${o.nivel} creado.`,
      }));
      const eventosActividades: HistorialEvento[] = actividades.map((a) => ({
        id: idAleatorio("hist"),
        elementoId: a.id,
        tipoElemento: "actividad",
        usuarioId: a.creadoPor,
        accion: "Creación",
        fecha: `${a.fechaCreacion}T09:00:00.000Z`,
        valorNuevo: a.nombre,
        comentario: `Elemento de nivel ${a.nivel} creado.`,
      }));
      historial = [...eventosObjetivos, ...eventosActividades];
      historialService.replaceAll(historial);
    }

    const alertas = generarAlertas({
      objetivos,
      actividades,
      actualizaciones,
      delegaciones,
      bloqueos,
      solicitudesCambio,
      usuarios,
      advertenciasPeso,
    });
    const alertasLeidasIds = alertasService.getLeidas();

    const usuarioActualId = sesionService.getUsuarioActualId();
    const usuarioActual = usuarios.find((u) => u.id === usuarioActualId) || null;

    setState((prev) => ({
      ...prev,
      cargando: false,
      usuarioActual,
      usuarios,
      objetivos,
      actividades,
      actualizaciones,
      delegaciones,
      evidencias,
      bloqueos,
      solicitudesCambio,
      historial,
      advertenciasPeso,
      alertas,
      alertasLeidasIds,
    }));
  }, []);

  useEffect(() => {
    cargarTodo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pushToast = useCallback((tipo: Toast["tipo"], mensaje: string) => {
    const id = idAleatorio("toast");
    setState((prev) => ({ ...prev, toasts: [...prev.toasts, { id, tipo, mensaje }] }));
    setTimeout(() => {
      setState((prev) => ({ ...prev, toasts: prev.toasts.filter((t) => t.id !== id) }));
    }, 4500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setState((prev) => ({ ...prev, toasts: prev.toasts.filter((t) => t.id !== id) }));
  }, []);

  const login = useCallback(
    (usuarioId: string) => {
      sesionService.setUsuarioActualId(usuarioId);
      cargarTodo();
    },
    [cargarTodo]
  );

  const logout = useCallback(() => {
    sesionService.setUsuarioActualId(null);
    setState((prev) => ({ ...prev, usuarioActual: null }));
  }, []);

  const registrarHistorial = useCallback(
    (
      elementoId: string,
      tipoElemento: "objetivo" | "actividad",
      usuarioId: string,
      accion: AccionHistorial,
      valorAnterior?: string,
      valorNuevo?: string,
      comentario?: string
    ) => {
      const evento: HistorialEvento = {
        id: idAleatorio("hist"),
        elementoId,
        tipoElemento,
        usuarioId,
        accion,
        fecha: nowIso(),
        valorAnterior,
        valorNuevo,
        comentario,
      };
      historialService.create(evento);
    },
    []
  );

  /** Persiste objetivos/actividades ya recalculados y refresca el estado + alertas. */
  const persistirYRefrescar = useCallback(
    (objetivosNext: Objetivo[], actividadesNext: Actividad[]) => {
      const { objetivos, actividades, advertenciasPeso } = recalcularCascada(objetivosNext, actividadesNext);
      objetivosService.replaceAll(objetivos);
      actividadesService.replaceAll(actividades);

      setState((prev) => {
        const alertas = generarAlertas({
          objetivos,
          actividades,
          actualizaciones: actualizacionesService.getAll(),
          delegaciones: delegacionesService.getAll(),
          bloqueos: bloqueosService.getAll(),
          solicitudesCambio: solicitudesCambioService.getAll(),
          usuarios: prev.usuarios,
          advertenciasPeso,
        });
        return {
          ...prev,
          objetivos,
          actividades,
          advertenciasPeso,
          alertas,
          historial: historialService.getAll(),
          actualizaciones: actualizacionesService.getAll(),
          delegaciones: delegacionesService.getAll(),
          bloqueos: bloqueosService.getAll(),
          solicitudesCambio: solicitudesCambioService.getAll(),
          evidencias: evidenciasService.getAll(),
        };
      });
    },
    []
  );

  const crearObjetivo = useCallback(
    (input: NuevoObjetivoInput): Objetivo => {
      const ahora = todayIso();
      const nuevo: Objetivo = {
        id: idAleatorio("obj"),
        parentId: input.parentId,
        nivel: input.nivel,
        nombre: input.nombre,
        descripcion: input.descripcion,
        responsableId: input.responsableId,
        participantesIds: input.participantesIds,
        area: input.area,
        fechaInicio: input.fechaInicio,
        fechaFin: input.fechaFin,
        prioridad: input.prioridad,
        indicador: input.indicador,
        valorBase: input.valorBase,
        meta: input.meta,
        unidad: input.unidad,
        peso: input.peso,
        avanceReportado: 0,
        avanceValidado: 0,
        avanceCalculado: 0,
        estatus: "Sin iniciar",
        riesgo: "Sin riesgo",
        criterioExito: input.criterioExito,
        creadoPor: input.creadoPor,
        fechaCreacion: ahora,
        ultimaActualizacion: ahora,
      };
      objetivosService.create(nuevo);
      registrarHistorial(nuevo.id, "objetivo", input.creadoPor, "Creación", undefined, nuevo.nombre);
      persistirYRefrescar(objetivosService.getAll(), actividadesService.getAll());
      pushToast("success", `Objetivo "${nuevo.nombre}" creado correctamente.`);
      return nuevo;
    },
    [persistirYRefrescar, pushToast, registrarHistorial]
  );

  const crearActividad = useCallback(
    (input: NuevaActividadInput): Actividad => {
      const ahora = todayIso();
      const nueva: Actividad = {
        id: idAleatorio("act"),
        parentId: input.parentId,
        objetivoId: input.objetivoId,
        nivel: input.nivel,
        nombre: input.nombre,
        descripcion: input.descripcion,
        responsablePropietarioId: input.responsablePropietarioId,
        responsableEjecutorId: input.responsablePropietarioId,
        fechaInicio: input.fechaInicio,
        fechaFin: input.fechaFin,
        peso: input.peso,
        avanceReportado: 0,
        avanceValidado: 0,
        avanceCalculado: 0,
        estatus: "Sin iniciar",
        prioridad: input.prioridad,
        bloqueada: false,
        entregableEsperado: input.entregableEsperado,
        evidenciaRequerida: input.evidenciaRequerida,
        dependencia: input.dependencia,
        ultimaActualizacion: ahora,
        creadoPor: input.creadoPor,
        fechaCreacion: ahora,
      };
      actividadesService.create(nueva);
      registrarHistorial(nueva.id, "actividad", input.creadoPor, "Creación", undefined, nueva.nombre);
      persistirYRefrescar(objetivosService.getAll(), actividadesService.getAll());
      pushToast("success", `Actividad "${nueva.nombre}" creada y asignada.`);
      return nueva;
    },
    [persistirYRefrescar, pushToast, registrarHistorial]
  );

  const actualizarAvance = useCallback(
    (
      elementoId: string,
      tipoElemento: "objetivo" | "actividad",
      nuevoAvance: number,
      comentario: string,
      usuarioId: string,
      evidenciaNombre?: string,
      nuevoEstatus?: Actividad["estatus"]
    ) => {
      const actividades = actividadesService.getAll();
      const objetivos = objetivosService.getAll();
      const elemento =
        tipoElemento === "actividad" ? actividades.find((a) => a.id === elementoId) : objetivos.find((o) => o.id === elementoId);
      if (!elemento) return;

      const avanceAnterior = elemento.avanceValidado;

      const actualizacion: Actualizacion = {
        id: idAleatorio("upd"),
        elementoId,
        tipoElemento,
        usuarioId,
        fecha: todayIso(),
        avanceAnterior,
        avanceNuevo: nuevoAvance,
        comentario,
        evidencia: evidenciaNombre,
        estatusValidacion: "Pendiente",
      };
      actualizacionesService.create(actualizacion);

      if (tipoElemento === "actividad") {
        actividadesService.update(elementoId, {
          avanceReportado: nuevoAvance,
          ultimaActualizacion: nowIso(),
          estatus: nuevoEstatus ?? (elemento as Actividad).estatus,
        });
      } else {
        objetivosService.update(elementoId, { avanceReportado: nuevoAvance, ultimaActualizacion: nowIso() });
      }

      registrarHistorial(
        elementoId,
        tipoElemento,
        usuarioId,
        "Actualización de avance",
        `${avanceAnterior}%`,
        `${nuevoAvance}%`,
        comentario
      );

      persistirYRefrescar(objetivosService.getAll(), actividadesService.getAll());
      pushToast("info", "Avance registrado. Queda pendiente de validación por tu líder.");
    },
    [persistirYRefrescar, pushToast, registrarHistorial]
  );

  const aprobarActualizacion = useCallback(
    (actualizacionId: string, aprobadoPor: string) => {
      const upd = actualizacionesService.getById(actualizacionId);
      if (!upd) return;
      actualizacionesService.aprobar(actualizacionId, aprobadoPor, nowIso());

      if (upd.tipoElemento === "actividad") {
        actividadesService.update(upd.elementoId, { avanceValidado: upd.avanceNuevo, ultimaActualizacion: nowIso() });
      } else {
        objetivosService.update(upd.elementoId, { avanceValidado: upd.avanceNuevo, ultimaActualizacion: nowIso() });
      }
      registrarHistorial(upd.elementoId, upd.tipoElemento, aprobadoPor, "Validación", `${upd.avanceAnterior}%`, `${upd.avanceNuevo}%`);
      persistirYRefrescar(objetivosService.getAll(), actividadesService.getAll());
      pushToast("success", "Avance validado. La cascada de objetivos se recalculó.");
    },
    [persistirYRefrescar, pushToast, registrarHistorial]
  );

  const rechazarActualizacion = useCallback(
    (actualizacionId: string, aprobadoPor: string, motivo: string) => {
      const upd = actualizacionesService.getById(actualizacionId);
      if (!upd) return;
      actualizacionesService.rechazar(actualizacionId, aprobadoPor, nowIso(), motivo);
      registrarHistorial(upd.elementoId, upd.tipoElemento, aprobadoPor, "Rechazo", undefined, undefined, motivo);
      persistirYRefrescar(objetivosService.getAll(), actividadesService.getAll());
      pushToast("warning", "Avance rechazado. Se notificó al colaborador.");
    },
    [persistirYRefrescar, pushToast, registrarHistorial]
  );

  const solicitarDelegacion = useCallback(
    (actividadId: string, origenId: string, destinoId: string, motivo: string, fechaPropuesta: string, comentarios: string) => {
      const nueva: Delegacion = {
        id: idAleatorio("del"),
        actividadId,
        usuarioOrigenId: origenId,
        usuarioDestinoId: destinoId,
        motivo,
        fechaSolicitud: todayIso(),
        fechaPropuesta,
        comentarios,
        estatus: "Pendiente",
      };
      delegacionesService.create(nueva);
      registrarHistorial(actividadId, "actividad", origenId, "Delegación", undefined, destinoId, motivo);
      persistirYRefrescar(objetivosService.getAll(), actividadesService.getAll());
      pushToast("info", "Solicitud de delegación enviada al líder para su aprobación.");
    },
    [persistirYRefrescar, pushToast, registrarHistorial]
  );

  const aprobarDelegacion = useCallback(
    (id: string, aprobadoPor: string) => {
      const deleg = delegacionesService.getById(id);
      if (!deleg) return;
      delegacionesService.aprobar(id, aprobadoPor, nowIso());
      actividadesService.update(deleg.actividadId, { responsableEjecutorId: deleg.usuarioDestinoId, ultimaActualizacion: nowIso() });
      registrarHistorial(deleg.actividadId, "actividad", aprobadoPor, "Cambio de ejecutor", deleg.usuarioOrigenId, deleg.usuarioDestinoId);
      persistirYRefrescar(objetivosService.getAll(), actividadesService.getAll());
      pushToast("success", "Delegación aprobada. El nuevo ejecutor fue notificado.");
    },
    [persistirYRefrescar, pushToast, registrarHistorial]
  );

  const rechazarDelegacion = useCallback(
    (id: string, aprobadoPor: string) => {
      const deleg = delegacionesService.getById(id);
      if (!deleg) return;
      delegacionesService.rechazar(id, aprobadoPor, nowIso());
      registrarHistorial(deleg.actividadId, "actividad", aprobadoPor, "Rechazo", undefined, undefined, "Delegación rechazada");
      persistirYRefrescar(objetivosService.getAll(), actividadesService.getAll());
      pushToast("warning", "Delegación rechazada.");
    },
    [persistirYRefrescar, pushToast, registrarHistorial]
  );

  const cancelarDelegacion = useCallback(
    (id: string) => {
      delegacionesService.cancelar(id, nowIso());
      persistirYRefrescar(objetivosService.getAll(), actividadesService.getAll());
      pushToast("info", "Delegación cancelada.");
    },
    [persistirYRefrescar, pushToast]
  );

  const reportarBloqueo = useCallback(
    (input: {
      actividadId: string;
      tipo: TipoBloqueo;
      descripcion: string;
      impacto: string;
      apoyoRequerido: string;
      responsableAtenderId: string;
      urgencia: UrgenciaBloqueo;
      reportadoPor: string;
    }) => {
      const nuevo: Bloqueo = {
        id: idAleatorio("blk"),
        actividadId: input.actividadId,
        tipo: input.tipo,
        descripcion: input.descripcion,
        impacto: input.impacto,
        apoyoRequerido: input.apoyoRequerido,
        responsableAtenderId: input.responsableAtenderId,
        fechaReporte: todayIso(),
        urgencia: input.urgencia,
        estatus: "Abierto",
        reportadoPor: input.reportadoPor,
      };
      bloqueosService.create(nuevo);
      actividadesService.update(input.actividadId, { bloqueada: true, motivoBloqueo: input.descripcion });
      registrarHistorial(input.actividadId, "actividad", input.reportadoPor, "Bloqueo reportado", undefined, input.tipo, input.descripcion);
      persistirYRefrescar(objetivosService.getAll(), actividadesService.getAll());
      pushToast("warning", "Bloqueo reportado. Tu líder fue notificado.");
    },
    [persistirYRefrescar, pushToast, registrarHistorial]
  );

  const resolverBloqueo = useCallback(
    (id: string) => {
      const blk = bloqueosService.getById(id);
      bloqueosService.resolver(id, nowIso());
      if (blk) {
        const otrosBloqueosActivos = bloqueosService.getAll().some((b) => b.actividadId === blk.actividadId && b.estatus !== "Resuelto" && b.id !== id);
        if (!otrosBloqueosActivos) {
          actividadesService.update(blk.actividadId, { bloqueada: false, motivoBloqueo: undefined });
        }
      }
      persistirYRefrescar(objetivosService.getAll(), actividadesService.getAll());
      pushToast("success", "Bloqueo marcado como resuelto.");
    },
    [persistirYRefrescar, pushToast]
  );

  const agregarEvidencia = useCallback(
    (input: { actividadId: string; nombreArchivo: string; tipoArchivo: TipoEvidencia; usuarioId: string; comentario?: string }) => {
      const nueva: Evidencia = {
        id: idAleatorio("ev"),
        actividadId: input.actividadId,
        nombreArchivo: input.nombreArchivo,
        tipoArchivo: input.tipoArchivo,
        tamanoSimulado: `${(Math.random() * 3 + 0.2).toFixed(1)} MB`,
        urlSimulada: `https://portal-simulado.local/evidencias/${encodeURIComponent(input.nombreArchivo)}`,
        usuarioId: input.usuarioId,
        comentario: input.comentario,
        fecha: todayIso(),
        estatusValidacion: "Pendiente",
      };
      evidenciasService.create(nueva);
      registrarHistorial(input.actividadId, "actividad", input.usuarioId, "Evidencia agregada", undefined, input.nombreArchivo);
      persistirYRefrescar(objetivosService.getAll(), actividadesService.getAll());
      pushToast("success", "Evidencia adjuntada correctamente.");
    },
    [persistirYRefrescar, pushToast, registrarHistorial]
  );

  const solicitarCambio = useCallback(
    (input: {
      elementoId: string;
      tipoElemento: "objetivo" | "actividad";
      tipo: TipoSolicitudCambio;
      valorAnterior: string;
      valorSolicitado: string;
      motivo: string;
      solicitadoPor: string;
    }) => {
      const nueva: SolicitudCambio = {
        id: idAleatorio("sc"),
        elementoId: input.elementoId,
        tipoElemento: input.tipoElemento,
        tipo: input.tipo,
        valorAnterior: input.valorAnterior,
        valorSolicitado: input.valorSolicitado,
        motivo: input.motivo,
        solicitadoPor: input.solicitadoPor,
        fechaSolicitud: todayIso(),
        estatus: "Pendiente",
      };
      solicitudesCambioService.create(nueva);
      registrarHistorial(input.elementoId, input.tipoElemento, input.solicitadoPor, "Cambio de fecha", input.valorAnterior, input.valorSolicitado, input.motivo);
      persistirYRefrescar(objetivosService.getAll(), actividadesService.getAll());
      pushToast("info", "Solicitud de cambio enviada para su aprobación.");
    },
    [persistirYRefrescar, pushToast, registrarHistorial]
  );

  const aprobarSolicitudCambio = useCallback(
    (id: string, resueltoPor: string) => {
      const sc = solicitudesCambioService.getById(id);
      if (!sc) return;
      solicitudesCambioService.aprobar(id, resueltoPor, nowIso());

      if (sc.tipo === "Cambio de fecha") {
        const pareceFecha = /^\d{4}-\d{2}-\d{2}$/.test(sc.valorSolicitado);
        if (pareceFecha) {
          if (sc.tipoElemento === "actividad") {
            actividadesService.update(sc.elementoId, { fechaFin: sc.valorSolicitado });
          } else {
            objetivosService.update(sc.elementoId, { fechaFin: sc.valorSolicitado });
          }
        }
      }
      registrarHistorial(sc.elementoId, sc.tipoElemento, resueltoPor, "Cambio de fecha", sc.valorAnterior, sc.valorSolicitado, `Solicitud aprobada: ${sc.motivo}`);
      persistirYRefrescar(objetivosService.getAll(), actividadesService.getAll());
      pushToast("success", "Solicitud de cambio aprobada.");
    },
    [persistirYRefrescar, pushToast, registrarHistorial]
  );

  const rechazarSolicitudCambio = useCallback(
    (id: string, resueltoPor: string) => {
      const sc = solicitudesCambioService.getById(id);
      if (!sc) return;
      solicitudesCambioService.rechazar(id, resueltoPor, nowIso());
      registrarHistorial(sc.elementoId, sc.tipoElemento, resueltoPor, "Rechazo", undefined, undefined, `Solicitud rechazada: ${sc.motivo}`);
      persistirYRefrescar(objetivosService.getAll(), actividadesService.getAll());
      pushToast("warning", "Solicitud de cambio rechazada.");
    },
    [persistirYRefrescar, pushToast, registrarHistorial]
  );

  const marcarAlertaLeida = useCallback((id: string) => {
    alertasService.marcarLeida(id);
    setState((prev) => ({ ...prev, alertasLeidasIds: alertasService.getLeidas() }));
  }, []);

  const marcarTodasAlertasLeidas = useCallback(() => {
    setState((prev) => {
      alertasService.marcarTodasLeidas(prev.alertas.map((a) => a.id));
      return { ...prev, alertasLeidasIds: alertasService.getLeidas() };
    });
  }, []);

  const restablecerDatos = useCallback(() => {
    const usuarioPrevioId = state.usuarioActual?.id ?? null;
    restablecerDatosDemo();
    if (usuarioPrevioId) sesionService.setUsuarioActualId(usuarioPrevioId);
    cargarTodo();
    pushToast("success", "Datos de demostración restablecidos correctamente.");
  }, [cargarTodo, pushToast, state.usuarioActual]);

  const getUsuario = useCallback((id?: string) => state.usuarios.find((u) => u.id === id), [state.usuarios]);
  const getObjetivo = useCallback((id?: string) => state.objetivos.find((o) => o.id === id), [state.objetivos]);
  const getActividad = useCallback((id?: string) => state.actividades.find((a) => a.id === id), [state.actividades]);
  const hijosDeUsuario = useCallback((liderId: string) => state.usuarios.filter((u) => u.liderId === liderId), [state.usuarios]);

  const alertasVisibles = useMemo(() => {
    if (!state.usuarioActual) return [];
    return state.alertas
      .filter((a) => alertaVisiblePara(a, state.usuarioActual as Usuario, state.usuarios))
      .map((a) => ({ ...a, leida: state.alertasLeidasIds.includes(a.id) }))
      .sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
  }, [state.alertas, state.alertasLeidasIds, state.usuarioActual, state.usuarios]);

  const value: AppContextValue = {
    ...state,
    login,
    logout,
    crearObjetivo,
    crearActividad,
    actualizarAvance,
    aprobarActualizacion,
    rechazarActualizacion,
    solicitarDelegacion,
    aprobarDelegacion,
    rechazarDelegacion,
    cancelarDelegacion,
    reportarBloqueo,
    resolverBloqueo,
    agregarEvidencia,
    solicitarCambio,
    aprobarSolicitudCambio,
    rechazarSolicitudCambio,
    marcarAlertaLeida,
    marcarTodasAlertasLeidas,
    restablecerDatos,
    pushToast,
    dismissToast,
    alertasVisibles,
    getUsuario,
    getObjetivo,
    getActividad,
    hijosDeUsuario,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp debe usarse dentro de <AppProvider>");
  return ctx;
}
