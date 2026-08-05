import type {
  Objetivo,
  Actividad,
  Actualizacion,
  Delegacion,
  Bloqueo,
  SolicitudCambio,
  Usuario,
  Alerta,
  Rol,
} from "../types";
import { avanceEsperado, diasRestantes, estaVencido, todayIso, diffDias, parseFecha } from "./dates";
import type { AdvertenciaPeso } from "./cascade";

export interface FuentesAlertas {
  objetivos: Objetivo[];
  actividades: Actividad[];
  actualizaciones: Actualizacion[];
  delegaciones: Delegacion[];
  bloqueos: Bloqueo[];
  solicitudesCambio: SolicitudCambio[];
  usuarios: Usuario[];
  advertenciasPeso: AdvertenciaPeso[];
}

const ACTIVAS = new Set(["Sin iniciar", "En tiempo", "En riesgo", "Retrasado"]);

function liderDe(usuarios: Usuario[], usuarioId?: string): string | undefined {
  return usuarios.find((u) => u.id === usuarioId)?.liderId;
}

/**
 * Genera el conjunto de alertas del sistema en tiempo real a partir del estado actual.
 * Los ids son deterministas para poder persistir el estado de "leída" por separado.
 */
export function generarAlertas(fuentes: FuentesAlertas): Alerta[] {
  const { objetivos, actividades, delegaciones, actualizaciones, bloqueos, solicitudesCambio, usuarios, advertenciasPeso } = fuentes;
  const alertas: Alerta[] = [];
  const hoyStr = todayIso();

  // 1) Actividades próximas a vencer (0-10 días)
  actividades.forEach((a) => {
    if (!ACTIVAS.has(a.estatus)) return;
    const rest = diasRestantes(a.fechaFin);
    if (rest >= 0 && rest <= 10) {
      alertas.push({
        id: `alrt-prox-${a.id}`,
        tipo: "Próximo a vencer",
        prioridad: rest <= 3 ? "Alta" : "Media",
        titulo: `"${a.nombre}" vence en ${rest} día(s)`,
        descripcion: `La actividad está próxima a su fecha compromiso (${a.fechaFin}).`,
        elementoId: a.id,
        tipoElemento: "actividad",
        fecha: hoyStr,
        leida: false,
        destinatarioRol: "Colaborador",
        destinatarioId: a.responsableEjecutorId,
      });
    }
  });

  // 2) Actividades vencidas
  actividades.forEach((a) => {
    if (a.estatus === "Completado" || a.estatus === "Cerrado") return;
    if (estaVencido(a.fechaFin)) {
      alertas.push({
        id: `alrt-venc-${a.id}`,
        tipo: "Vencido",
        prioridad: "Alta",
        titulo: `"${a.nombre}" está vencida`,
        descripcion: `La fecha compromiso (${a.fechaFin}) ya pasó y el avance validado es ${a.avanceValidado}%.`,
        elementoId: a.id,
        tipoElemento: "actividad",
        fecha: hoyStr,
        leida: false,
        destinatarioRol: "Colaborador",
        destinatarioId: a.responsableEjecutorId,
      });
    }
  });

  // 3) Actividades sin actualización reciente (> 20 días), en progreso
  actividades.forEach((a) => {
    if (!ACTIVAS.has(a.estatus)) return;
    if (a.avanceValidado <= 0) return;
    const dias = diffDias(parseFecha(a.ultimaActualizacion.slice(0, 10)), parseFecha(hoyStr));
    if (dias > 20) {
      alertas.push({
        id: `alrt-sinact-${a.id}`,
        tipo: "Sin actualización",
        prioridad: "Media",
        titulo: `"${a.nombre}" sin actualizar hace ${dias} días`,
        descripcion: `El responsable no ha registrado avances recientes.`,
        elementoId: a.id,
        tipoElemento: "actividad",
        fecha: hoyStr,
        leida: false,
        destinatarioRol: "Lider",
        destinatarioId: liderDe(usuarios, a.responsableEjecutorId),
      });
    }
  });

  // 4) Bloqueos críticos / abiertos
  bloqueos.forEach((b) => {
    if (b.estatus === "Resuelto") return;
    if (b.urgencia === "Crítica" || b.urgencia === "Alta") {
      alertas.push({
        id: `alrt-bloq-${b.id}`,
        tipo: "Bloqueo crítico",
        prioridad: b.urgencia === "Crítica" ? "Alta" : "Media",
        titulo: `Bloqueo ${b.urgencia.toLowerCase()}: ${b.tipo}`,
        descripcion: b.descripcion,
        elementoId: b.actividadId,
        tipoElemento: "actividad",
        fecha: b.fechaReporte,
        leida: false,
        destinatarioRol: b.urgencia === "Crítica" ? "Todos" : "Lider",
        destinatarioId: b.responsableAtenderId,
      });
    }
  });

  // 5) Delegaciones pendientes
  delegaciones.forEach((d) => {
    if (d.estatus !== "Pendiente") return;
    alertas.push({
      id: `alrt-deleg-${d.id}`,
      tipo: "Delegación pendiente",
      prioridad: "Media",
      titulo: "Delegación pendiente de aprobación",
      descripcion: d.motivo,
      elementoId: d.actividadId,
      tipoElemento: "actividad",
      fecha: d.fechaSolicitud,
      leida: false,
      destinatarioRol: "Lider",
      destinatarioId: liderDe(usuarios, d.usuarioOrigenId),
    });
  });

  // 6) Avances pendientes de validar
  actualizaciones.forEach((u) => {
    if (u.estatusValidacion !== "Pendiente") return;
    const elemento = actividades.find((a) => a.id === u.elementoId) || objetivos.find((o) => o.id === u.elementoId);
    alertas.push({
      id: `alrt-avance-${u.id}`,
      tipo: "Avance pendiente de validar",
      prioridad: "Media",
      titulo: `Avance pendiente: "${elemento?.nombre ?? u.elementoId}"`,
      descripcion: `Reportado ${u.avanceNuevo}% (anterior ${u.avanceAnterior}%).`,
      elementoId: u.elementoId,
      tipoElemento: u.tipoElemento,
      fecha: u.fecha,
      leida: false,
      destinatarioRol: "Lider",
      destinatarioId: liderDe(usuarios, u.usuarioId),
    });
  });

  // 7) Pesos que no suman 100%
  advertenciasPeso.forEach((w) => {
    alertas.push({
      id: `alrt-peso-${w.elementoId}`,
      tipo: "Pesos no suman 100%",
      prioridad: "Media",
      titulo: `Los pesos de "${w.elementoNombre}" suman ${w.sumaPesos}%`,
      descripcion: `${w.hijos} elemento(s) hijo con una suma de pesos distinta a 100%. Revisa la distribución.`,
      elementoId: w.elementoId,
      tipoElemento: w.tipoElemento,
      fecha: hoyStr,
      leida: false,
      destinatarioRol: "Todos",
    });
  });

  // 8) Objetivos con desviación crítica (rojo por más de 15 puntos)
  objetivos.forEach((o) => {
    if (o.estatus === "Completado" || o.estatus === "Cerrado") return;
    const esperado = avanceEsperado(o.fechaInicio, o.fechaFin);
    const desviacion = o.avanceCalculado - esperado;
    if (desviacion < -15) {
      alertas.push({
        id: `alrt-desv-${o.id}`,
        tipo: "Desviación crítica",
        prioridad: "Alta",
        titulo: `"${o.nombre}" con desviación crítica`,
        descripcion: `Avance real ${o.avanceCalculado}% vs. esperado ${esperado}% (${Math.round(desviacion)} pts).`,
        elementoId: o.id,
        tipoElemento: "objetivo",
        fecha: hoyStr,
        leida: false,
        destinatarioRol: o.nivel === 1 ? "Todos" : "Lider",
        destinatarioId: o.nivel === 1 ? undefined : o.responsableId,
      });
    }
  });

  // 9) Solicitudes de cambio pendientes
  solicitudesCambio.forEach((s) => {
    if (s.estatus !== "Pendiente") return;
    const esObjetivo = s.tipoElemento === "objetivo";
    alertas.push({
      id: `alrt-solic-${s.id}`,
      tipo: "Solicitud de cambio pendiente",
      prioridad: "Media",
      titulo: `${s.tipo} pendiente de resolución`,
      descripcion: s.motivo,
      elementoId: s.elementoId,
      tipoElemento: s.tipoElemento,
      fecha: s.fechaSolicitud,
      leida: false,
      destinatarioRol: esObjetivo ? "Director" : "Lider",
      destinatarioId: esObjetivo ? "dir" : liderDe(usuarios, s.solicitadoPor),
    });
  });

  return alertas;
}

export function alertaVisiblePara(alerta: Alerta, usuario: Usuario, usuarios: Usuario[]): boolean {
  if (usuario.rol === "Director") return true;
  if (alerta.destinatarioRol === "Todos") {
    return usuario.rol === "Lider" || alerta.destinatarioId === usuario.id;
  }
  if (usuario.rol === "Lider") {
    if (alerta.destinatarioId === usuario.id) return true;
    const destino = usuarios.find((u) => u.id === alerta.destinatarioId);
    return !!destino && destino.liderId === usuario.id;
  }
  // Colaborador
  return alerta.destinatarioId === usuario.id;
}

export function rolPuedeVerAlertaGlobalmente(rol: Rol): boolean {
  return rol === "Director";
}
