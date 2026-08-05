// =====================================================================================
// MODELO DE DATOS - Portal de Objetivos Estratégicos
// Estas interfaces representan el contrato de datos de la beta (LocalStorage).
// Están diseñadas para mapear 1:1 con futuras tablas de Microsoft Dataverse:
//   Usuario            -> tabla "Contactos/Usuarios" (o Azure AD + tabla de perfil)
//   Objetivo           -> tabla "Objetivos" (niveles 1, 2 y 3: estratégico, área, iniciativa)
//   Actividad          -> tabla "Actividades" (niveles 4 y 5: actividad y subactividad)
//   Actualizacion      -> tabla "Actualizaciones de avance"
//   Delegacion         -> tabla "Delegaciones"
//   Evidencia          -> tabla "Evidencias" (en Dataverse: columna de archivo / SharePoint)
//   Bloqueo            -> tabla "Bloqueos"
//   SolicitudCambio    -> tabla "Solicitudes de cambio"
//   Alerta             -> generada en cliente (en Dataverse: Power Automate + tabla Notificaciones)
//   HistorialEvento    -> tabla "Historial / Auditoría"
// =====================================================================================

export type Rol = "Director" | "Lider" | "Colaborador";

export type Area =
  | "Operaciones"
  | "Recursos Humanos"
  | "Finanzas"
  | "Tecnología"
  | "Comercial";

export type Prioridad = "Alta" | "Media" | "Baja";

export type NivelObjetivo = 1 | 2 | 3; // 1 Estratégico, 2 Área, 3 Iniciativa/Proyecto
export type NivelActividad = 4 | 5; // 4 Actividad, 5 Subactividad

export type EstatusElemento =
  | "Sin iniciar"
  | "En tiempo"
  | "En riesgo"
  | "Retrasado"
  | "Vencido"
  | "Completado"
  | "Cerrado";

export type NivelRiesgo = "Sin riesgo" | "Bajo" | "Medio" | "Alto" | "Crítico";

export type Semaforo = "verde" | "amarillo" | "rojo" | "gris";

export type EstatusValidacion = "Pendiente" | "Validado" | "Rechazado";

export type EstatusDelegacion = "Pendiente" | "Aprobada" | "Rechazada" | "Cancelada";

export type TipoBloqueo =
  | "Dependencia interna"
  | "Falta de información"
  | "Falta de autorización"
  | "Falta de recurso"
  | "Problema técnico"
  | "Dependencia externa"
  | "Otro";

export type UrgenciaBloqueo = "Baja" | "Media" | "Alta" | "Crítica";

export type EstatusBloqueo = "Abierto" | "En atención" | "Resuelto";

export type TipoSolicitudCambio =
  | "Cambio de fecha"
  | "Cambio de alcance"
  | "Cambio de responsable"
  | "Cambio de peso";

export type EstatusSolicitud = "Pendiente" | "Aprobada" | "Rechazada";

export type TipoAprobacion =
  | "Validación de avance"
  | "Delegación"
  | "Cambio de fecha"
  | "Cambio de responsable"
  | "Cambio de alcance"
  | "Cierre de actividad";

export type TipoAlerta =
  | "Próximo a vencer"
  | "Vencido"
  | "Sin actualización"
  | "Bloqueo crítico"
  | "Delegación pendiente"
  | "Avance pendiente de validar"
  | "Pesos no suman 100%"
  | "Desviación crítica"
  | "Solicitud de cambio pendiente";

export type TipoEvidencia = "PDF" | "Excel" | "Word" | "Imagen" | "Enlace";

export type AccionHistorial =
  | "Creación"
  | "Cambio de responsable"
  | "Cambio de ejecutor"
  | "Cambio de fecha"
  | "Actualización de avance"
  | "Validación"
  | "Rechazo"
  | "Delegación"
  | "Evidencia agregada"
  | "Bloqueo reportado"
  | "Cierre"
  | "Reapertura";

// -------------------------------------------------------------------------------------
export interface Usuario {
  id: string;
  nombre: string;
  puesto: string;
  area: Area;
  correo: string;
  rol: Rol;
  liderId?: string;
  avatar: string;
  activo: boolean;
}

// -------------------------------------------------------------------------------------
// Objetivo: cubre niveles 1 (estratégico), 2 (área) y 3 (iniciativa/proyecto)
export interface Objetivo {
  id: string;
  parentId: string | null;
  nivel: NivelObjetivo;
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
  avanceReportado: number;
  avanceValidado: number;
  avanceCalculado: number;
  estatus: EstatusElemento;
  riesgo: NivelRiesgo;
  criterioExito?: string;
  creadoPor: string;
  fechaCreacion: string;
  ultimaActualizacion: string;
}

// -------------------------------------------------------------------------------------
// Actividad: cubre niveles 4 (actividad) y 5 (subactividad)
export interface Actividad {
  id: string;
  parentId: string | null;
  objetivoId: string;
  nivel: NivelActividad;
  nombre: string;
  descripcion: string;
  responsablePropietarioId: string;
  responsableEjecutorId: string;
  fechaInicio: string;
  fechaFin: string;
  peso: number;
  avanceReportado: number;
  avanceValidado: number;
  avanceCalculado: number;
  estatus: EstatusElemento;
  prioridad: Prioridad;
  bloqueada: boolean;
  motivoBloqueo?: string;
  entregableEsperado?: string;
  evidenciaRequerida: boolean;
  dependencia?: string;
  ultimaActualizacion: string;
  creadoPor: string;
  fechaCreacion: string;
}

// -------------------------------------------------------------------------------------
export interface Actualizacion {
  id: string;
  elementoId: string;
  tipoElemento: "objetivo" | "actividad";
  usuarioId: string;
  fecha: string;
  avanceAnterior: number;
  avanceNuevo: number;
  comentario: string;
  evidencia?: string;
  estatusValidacion: EstatusValidacion;
  validadoPor?: string;
  fechaValidacion?: string;
  motivoRechazo?: string;
}

// -------------------------------------------------------------------------------------
export interface Delegacion {
  id: string;
  actividadId: string;
  usuarioOrigenId: string;
  usuarioDestinoId: string;
  motivo: string;
  fechaSolicitud: string;
  fechaPropuesta?: string;
  comentarios?: string;
  estatus: EstatusDelegacion;
  aprobadoPor?: string;
  fechaResolucion?: string;
}

// -------------------------------------------------------------------------------------
export interface Evidencia {
  id: string;
  actividadId: string;
  nombreArchivo: string;
  tipoArchivo: TipoEvidencia;
  tamanoSimulado: string;
  urlSimulada: string;
  usuarioId: string;
  comentario?: string;
  fecha: string;
  estatusValidacion: EstatusValidacion;
}

// -------------------------------------------------------------------------------------
export interface Bloqueo {
  id: string;
  actividadId: string;
  tipo: TipoBloqueo;
  descripcion: string;
  impacto: string;
  apoyoRequerido: string;
  responsableAtenderId: string;
  fechaReporte: string;
  urgencia: UrgenciaBloqueo;
  estatus: EstatusBloqueo;
  reportadoPor: string;
  fechaResolucion?: string;
}

// -------------------------------------------------------------------------------------
export interface SolicitudCambio {
  id: string;
  elementoId: string;
  tipoElemento: "objetivo" | "actividad";
  tipo: TipoSolicitudCambio;
  valorAnterior: string;
  valorSolicitado: string;
  motivo: string;
  solicitadoPor: string;
  fechaSolicitud: string;
  estatus: EstatusSolicitud;
  resueltoPor?: string;
  fechaResolucion?: string;
}

// -------------------------------------------------------------------------------------
export interface Alerta {
  id: string;
  tipo: TipoAlerta;
  prioridad: Prioridad;
  titulo: string;
  descripcion: string;
  elementoId?: string;
  tipoElemento?: "objetivo" | "actividad";
  fecha: string;
  leida: boolean;
  destinatarioRol: Rol | "Todos";
  destinatarioId?: string;
}

// -------------------------------------------------------------------------------------
export interface HistorialEvento {
  id: string;
  elementoId: string;
  tipoElemento: "objetivo" | "actividad";
  usuarioId: string;
  accion: AccionHistorial;
  fecha: string;
  valorAnterior?: string;
  valorNuevo?: string;
  comentario?: string;
}

// -------------------------------------------------------------------------------------
export interface AprobacionPendiente {
  id: string;
  tipo: TipoAprobacion;
  origenId: string;
  solicitanteId: string;
  elementoId: string;
  elementoNombre: string;
  fecha: string;
  valorAnterior: string;
  valorPropuesto: string;
  motivo: string;
  evidencia?: string;
}
