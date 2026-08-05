import type { EstatusElemento, Prioridad, NivelRiesgo, EstatusValidacion, EstatusDelegacion, EstatusSolicitud, EstatusBloqueo, UrgenciaBloqueo } from "../types";

// Clases utilitarias de Tailwind para cada estatus/prioridad/riesgo. Centralizado
// para que toda la app use exactamente la misma paleta corporativa.

export const estatusClases: Record<EstatusElemento, string> = {
  "Sin iniciar": "bg-slate-100 text-slate-600 border border-slate-200",
  "En tiempo": "bg-emerald-50 text-success border border-emerald-200",
  "En riesgo": "bg-amber-50 text-amber-700 border border-amber-200",
  "Retrasado": "bg-amber-50 text-amber-700 border border-amber-200",
  "Vencido": "bg-red-50 text-danger border border-red-200",
  "Completado": "bg-emerald-50 text-success border border-emerald-200",
  "Cerrado": "bg-slate-100 text-slate-600 border border-slate-200",
};

export const prioridadClases: Record<Prioridad, string> = {
  Alta: "bg-red-50 text-danger border border-red-200",
  Media: "bg-amber-50 text-amber-700 border border-amber-200",
  Baja: "bg-brand-light text-brand-blue border border-blue-200",
};

export const riesgoClases: Record<NivelRiesgo, string> = {
  "Sin riesgo": "bg-slate-100 text-slate-600 border border-slate-200",
  Bajo: "bg-emerald-50 text-success border border-emerald-200",
  Medio: "bg-amber-50 text-amber-700 border border-amber-200",
  Alto: "bg-orange-50 text-orange-700 border border-orange-200",
  "Crítico": "bg-red-50 text-danger border border-red-200",
};

export const validacionClases: Record<EstatusValidacion, string> = {
  Pendiente: "bg-amber-50 text-amber-700 border border-amber-200",
  Validado: "bg-emerald-50 text-success border border-emerald-200",
  Rechazado: "bg-red-50 text-danger border border-red-200",
};

export const delegacionClases: Record<EstatusDelegacion, string> = {
  Pendiente: "bg-amber-50 text-amber-700 border border-amber-200",
  Aprobada: "bg-emerald-50 text-success border border-emerald-200",
  Rechazada: "bg-red-50 text-danger border border-red-200",
  Cancelada: "bg-slate-100 text-slate-600 border border-slate-200",
};

export const solicitudClases: Record<EstatusSolicitud, string> = {
  Pendiente: "bg-amber-50 text-amber-700 border border-amber-200",
  Aprobada: "bg-emerald-50 text-success border border-emerald-200",
  Rechazada: "bg-red-50 text-danger border border-red-200",
};

export const bloqueoEstatusClases: Record<EstatusBloqueo, string> = {
  Abierto: "bg-red-50 text-danger border border-red-200",
  "En atención": "bg-amber-50 text-amber-700 border border-amber-200",
  Resuelto: "bg-emerald-50 text-success border border-emerald-200",
};

export const urgenciaClases: Record<UrgenciaBloqueo, string> = {
  Baja: "bg-brand-light text-brand-blue border border-blue-200",
  Media: "bg-amber-50 text-amber-700 border border-amber-200",
  Alta: "bg-orange-50 text-orange-700 border border-orange-200",
  "Crítica": "bg-red-50 text-danger border border-red-200",
};
