// ============================================================================
// MODELO DE DATOS LOCAL — Portal de Objetivos en Cascada (INTER-CON)
// Cada entidad usa IDs únicos y relaciones explícitas (sin objeto global).
// ============================================================================

export type RolUsuario = "Administrador" | "Direccion" | "Lider" | "Colaborador";

export interface Usuario {
  usuarioId: string;
  empleadoId: string;
  nombre: string;
  correo: string;
  passwordDemo: string;
  rol: RolUsuario;
  areaId: string;
  puesto: string;
  liderId: string | null;
  nombreLider: string | null;
  activo: boolean;
  personasACargo: string[]; // usuarioId[]
  permisos: string[];
  esSuperUsuario?: boolean;
}

export type TipoNodoCascada = "Objetivo" | "Proyecto" | "Actividad";
export type EstatusNodoCascada = "Borrador" | "Pendiente Dirección" | "Cambios solicitados" | "Aprobado" | "En ejecución" | "Cumplido" | "Rechazado";

/** Unidad universal de despliegue. La relación padreId permite tantos niveles
 * organizacionales como existan; la capacidad de asignar nace de tener
 * reportes directos, no de un rol rígido. */
export interface NodoCascada {
  nodoId: string;
  padreId: string | null;
  raizId: string;
  tipo: TipoNodoCascada;
  titulo: string;
  descripcion: string;
  indicador: string;
  lineaBase: number;
  meta: number;
  unidad: string;
  fechaInicio: string;
  fechaFin: string;
  ponderacion: number;
  avance: number;
  responsableId: string;
  asignadoPorId: string;
  creadoPorId: string;
  estatus: EstatusNodoCascada;
  nivel: number;
  comentarioAprobacion: string;
  aprobadoPorId: string | null;
  fechaAprobacion: string | null;
  fechaCreacion: string;
}

export interface Area {
  areaId: string;
  nombre: string;
  descripcion: string;
  colorHex: string;
  liderId: string | null;
}

export interface Periodo {
  periodoId: string;
  nombre: string;
  anioFiscal: string;
  fechaInicio: string; // ISO
  fechaFin: string; // ISO
  activo: boolean;
}

// ---------------------------------------------------------------------------
// OBJETIVO ESTRATÉGICO (Dirección) + participación de áreas
// ---------------------------------------------------------------------------
export interface Objetivo {
  objetivoId: string;
  nombreCorto: string;
  descripcion: string;
  resultadoEsperado: string;
  indicador: string;
  lineaBase: number;
  meta: number;
  unidad: string;
  fechaInicio: string;
  fechaFin: string;
  periodoId: string;
  anioFiscal: string;
  relevanciaEstrategica: string;
  evidenciaEsperada: string;
  riesgosIniciales: string;
  responsablePrincipalId: string; // usuarioId (normalmente Dirección)
  smartScore: number; // 0-100, calificación del asistente IA simulada
  smartDetalle: SmartEvaluacion | null;
  creadoPorId: string;
  fechaCreacion: string;
  estatus: "Activo" | "Cerrado" | "Cancelado";
}

export interface ObjetivoArea {
  objetivoAreaId: string;
  objetivoId: string;
  areaId: string;
  ponderacion: number; // % — la suma de todas las áreas de un objetivo debe ser 100
}

export interface SmartEvaluacion {
  puntaje: number;
  especifico: { ok: boolean; mensaje: string };
  medible: { ok: boolean; mensaje: string };
  alcanzable: { ok: boolean; mensaje: string };
  relevante: { ok: boolean; mensaje: string };
  temporal: { ok: boolean; mensaje: string };
  faltantes: string[];
  redaccionSugerida: string;
  bloqueante: boolean;
}

// ---------------------------------------------------------------------------
// PROYECTO / META DE ÁREA (creado por el Líder a partir de un Objetivo)
// ---------------------------------------------------------------------------
export interface Proyecto {
  proyectoId: string;
  objetivoId: string;
  areaId: string;
  nombre: string;
  descripcion: string;
  indicador: string;
  lineaBase: number;
  meta: number;
  unidad: string;
  fechaInicio: string;
  fechaFin: string;
  ponderacion: number; // % dentro de la contribución del área (si hay varios proyectos por área)
  responsableId: string;
  evidenciaEsperada: string;
  dependencias: string;
  riesgos: string;
  creadoPorId: string;
  fechaCreacion: string;
  estatus: "Activo" | "Cerrado" | "Cancelado";
}

// ---------------------------------------------------------------------------
// ACTIVIDAD — estructura auto-referenciada: nivel "actividad" (cuelga de un
// Proyecto) y nivel "subactividad" (cuelga de otra Actividad vía padreId).
// Esto modela: Actividad asignada -> Subactividades del colaborador.
// ---------------------------------------------------------------------------
export type PrioridadActividad = "Baja" | "Media" | "Alta" | "Crítica";
export type EstadoActividad =
  | "Pendiente"
  | "En progreso"
  | "Completada"
  | "Bloqueada"
  | "Vencida"
  | "Pendiente de aprobación";

export interface Actividad {
  actividadId: string;
  proyectoId: string; // proyecto raíz al que pertenece (heredado también en subactividades)
  actividadPadreId: string | null; // null = actividad de primer nivel del proyecto
  nombre: string;
  descripcion: string;
  responsableId: string;
  areaResponsableId: string;
  fechaInicio: string;
  fechaFin: string;
  prioridad: PrioridadActividad;
  ponderacion: number; // % respecto a hermanos (mismo padre / mismo proyecto)
  indicador: string;
  meta: string;
  evidenciaEsperada: string;
  dependeDeActividadId: string | null;
  comentariosTexto: string; // nota libre de creación
  requiereApoyoInterarea: boolean;
  avance: number; // 0-100, calculado si tiene hijos; capturado si es hoja
  estado: EstadoActividad;
  bloqueada: boolean;
  motivoBloqueo: string | null;
  origenSolicitudId: string | null; // si la actividad nació de una solicitud interárea aprobada
  creadoPorId: string;
  fechaCreacion: string;
  fechaUltimaActualizacion: string;
  // Compatibilidad futura con Evaluación de Desempeño
  edd: EddCampos;
}

export interface EddCampos {
  periodoId: string;
  cicloEvaluacionId: string;
  empleadoId: string;
  liderId: string | null;
  objetivoId: string;
  proyectoId: string;
  actividadId: string;
  indicador: string;
  lineaBase: number | null;
  meta: number | null;
  unidad: string;
  ponderacionEdd: number;
  avanceFinal: number | null;
  cumplimientoCalculado: number | null;
  evidencias: number;
  validadoPorLider: boolean;
  fechaValidacion: string | null;
  estatusIntegracionEdd: "No aplica" | "Pendiente de ciclo" | "Disponible para EDD" | "Transferido (simulado)";
}

export interface Dependencia {
  dependenciaId: string;
  actividadOrigenId: string;
  actividadDestinoId: string;
  tipo: "Bloqueante" | "Informativa";
}

export interface Evidencia {
  evidenciaId: string;
  actividadId: string;
  nombreArchivo: string;
  tipo: string;
  tamanioKB: number;
  fecha: string;
  comentario: string;
  subidoPorId: string;
  validada: boolean;
}

// ---------------------------------------------------------------------------
// SOLICITUD INTERÁREA
// ---------------------------------------------------------------------------
export type EstatusSolicitud =
  | "Borrador"
  | "Pendiente del líder solicitante"
  | "Pendiente del líder del área requerida"
  | "Cambios solicitados"
  | "Aceptada"
  | "Rechazada"
  | "Cancelada";

export interface SolicitudInterarea {
  solicitudId: string;
  objetivoId: string;
  proyectoId: string;
  actividadOrigenId: string; // actividad/subactividad que generó la necesidad de apoyo
  solicitanteId: string; // colaborador o líder que pide el apoyo
  areaSolicitanteId: string;
  liderSolicitanteId: string;
  personaRequeridaId: string;
  areaRequeridaId: string;
  liderAreaRequeridaId: string;
  descripcionActividad: string;
  fechaInicio: string;
  fechaFin: string;
  prioridad: PrioridadActividad;
  cargaEstimadaHrs: number;
  justificacion: string;
  dependencias: string;
  estatus: EstatusSolicitud;
  actividadCreadaId: string | null;
  motivoRechazo: string | null;
  fechaCreacion: string;
  fechaActualizacion: string;
}

export interface Aprobacion {
  aprobacionId: string;
  solicitudId: string;
  aprobadorId: string;
  rolAprobador: "Líder solicitante" | "Líder área requerida";
  decision: "Aceptada" | "Rechazada" | "Cambios solicitados" | "Comentario";
  comentario: string;
  fecha: string;
}

export interface Comentario {
  comentarioId: string;
  entidadTipo: "Actividad" | "Solicitud" | "Objetivo" | "Proyecto";
  entidadId: string;
  autorId: string;
  texto: string;
  fecha: string;
}

// ---------------------------------------------------------------------------
// NOTIFICACIONES / BITÁCORA
// ---------------------------------------------------------------------------
export type TipoNotificacion =
  | "Nueva actividad asignada"
  | "Solicitud interárea recibida"
  | "Solicitud aprobada"
  | "Solicitud rechazada"
  | "Cambios solicitados"
  | "Actividad próxima a vencer"
  | "Actividad vencida"
  | "Evidencia pendiente"
  | "Bloqueo reportado"
  | "Avance sin actualizar"
  | "Objetivo asignado";

export interface Notificacion {
  notificacionId: string;
  usuarioId: string;
  tipo: TipoNotificacion;
  titulo: string;
  mensaje: string;
  entidadTipo: string;
  entidadId: string;
  leida: boolean;
  fecha: string;
}

export interface Bitacora {
  bitacoraId: string;
  usuarioId: string;
  accion: string;
  entidadTipo: string;
  entidadId: string;
  detalle: string;
  fecha: string;
}

export interface ConfiguracionEDD {
  cicloActivo: string;
  fechaAperturaCiclo: string;
  fechaCierreCiclo: string;
  topePonderacionPorEmpleado: number;
  reglas: string[];
}

// ---------------------------------------------------------------------------
// Base de datos completa (forma de almacenamiento en localStorage)
// ---------------------------------------------------------------------------
export interface DemoDatabase {
  version: number;
  usuarios: Usuario[];
  areas: Area[];
  periodos: Periodo[];
  objetivos: Objetivo[];
  nodosCascada: NodoCascada[];
  objetivoAreas: ObjetivoArea[];
  proyectos: Proyecto[];
  actividades: Actividad[];
  dependencias: Dependencia[];
  evidencias: Evidencia[];
  solicitudes: SolicitudInterarea[];
  aprobaciones: Aprobacion[];
  comentarios: Comentario[];
  notificaciones: Notificacion[];
  bitacora: Bitacora[];
  configuracionEdd: ConfiguracionEDD;
}
