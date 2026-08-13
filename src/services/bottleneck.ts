import type { Actividad, DemoDatabase, SolicitudInterarea } from "../types";
import { avanceEsperadoPorFecha, desviacion, diasRestantes, esHoja } from "./calc";

// ============================================================================
// Motor de detección de cuellos de botella — reglas locales, explicables.
// Identifica exactamente qué nodo de la cascada está deteniendo el objetivo,
// en vez de "regañar a todos".
// ============================================================================

export interface Cuello {
  tipo: "Actividad" | "Solicitud";
  id: string;
  nombre: string;
  responsable: string;
  areaId: string | null;
  score: number;
  razones: string[];
}

const DIAS_SIN_ACTUALIZAR_ALERTA = 10;
const DIAS_SOLICITUD_SIN_RESPUESTA = 5;
const SOBRECARGA_MIN_ACTIVIDADES = 4;

export function detectarCuellosDeBotella(
  objetivoId: string,
  db: Pick<DemoDatabase, "actividades" | "proyectos" | "solicitudes" | "usuarios" | "evidencias">,
  hoy: Date = new Date()
): Cuello[] {
  const proyectosDelObjetivo = new Set(db.proyectos.filter((p) => p.objetivoId === objetivoId).map((p) => p.proyectoId));
  const actividadesDelObjetivo = db.actividades.filter((a) => proyectosDelObjetivo.has(a.proyectoId));

  // Conteo de carga activa por responsable (para detectar sobrecarga)
  const cargaPorResponsable = new Map<string, number>();
  db.actividades.forEach((a) => {
    if (esHoja(a.actividadId, db.actividades) && a.avance < 100 && a.estado !== "Bloqueada") {
      cargaPorResponsable.set(a.responsableId, (cargaPorResponsable.get(a.responsableId) ?? 0) + 1);
    }
  });

  const resultados: Cuello[] = [];

  actividadesDelObjetivo
    .filter((a) => esHoja(a.actividadId, db.actividades) && a.avance < 100)
    .forEach((a) => {
      const razones: string[] = [];
      let score = 0;

      const vencida = diasRestantes(a.fechaFin, hoy) < 0;
      if (a.estado === "Bloqueada" || a.bloqueada) {
        score += 40;
        razones.push(`Actividad bloqueada${a.motivoBloqueo ? `: ${a.motivoBloqueo}` : "."}`);
      }
      if (vencida) {
        score += 30;
        razones.push(`Actividad vencida hace ${Math.abs(diasRestantes(a.fechaFin, hoy))} día(s).`);
      }
      const espera = avanceEsperadoPorFecha(a.fechaInicio, a.fechaFin, hoy);
      const desv = desviacion(a.avance, espera);
      if (desv <= -10) {
        score += Math.min(30, Math.round(-desv));
        razones.push(`Avance real (${a.avance}%) muy por debajo del esperado (${espera}%): desviación de ${desv} puntos.`);
      }
      if (a.dependeDeActividadId) {
        const dep = db.actividades.find((d) => d.actividadId === a.dependeDeActividadId);
        if (dep && dep.avance < 100) {
          score += 15;
          razones.push(`Depende de "${dep.nombre}", que aún tiene ${dep.avance}% de avance.`);
        }
      }
      const diasSinActualizar = diasEntre(a.fechaUltimaActualizacion, hoy);
      if (diasSinActualizar >= DIAS_SIN_ACTUALIZAR_ALERTA) {
        score += 10;
        razones.push(`No se actualiza el avance desde hace ${diasSinActualizar} días.`);
      }
      if (a.evidenciaEsperada && a.evidenciaEsperada.trim().length > 0) {
        const evidencias = db.evidencias.filter((e) => e.actividadId === a.actividadId);
        if (evidencias.length === 0 || evidencias.every((e) => !e.validada)) {
          score += 8;
          razones.push("Evidencia esperada pendiente de adjuntar o validar.");
        }
      }
      const carga = cargaPorResponsable.get(a.responsableId) ?? 0;
      if (carga >= SOBRECARGA_MIN_ACTIVIDADES) {
        score += 10;
        razones.push(`Sobrecarga del responsable: tiene ${carga} actividades activas simultáneas.`);
      }

      if (score > 0) {
        const responsable = db.usuarios.find((u) => u.usuarioId === a.responsableId);
        resultados.push({
          tipo: "Actividad",
          id: a.actividadId,
          nombre: a.nombre,
          responsable: responsable?.nombre ?? a.responsableId,
          areaId: a.areaResponsableId,
          score,
          razones,
        });
      }
    });

  // Solicitudes interárea sin respuesta oportuna
  db.solicitudes
    .filter((s) => s.objetivoId === objetivoId && esPendiente(s))
    .forEach((s) => {
      const dias = diasEntre(s.fechaActualizacion, hoy);
      if (dias >= DIAS_SOLICITUD_SIN_RESPUESTA) {
        const solicitante = db.usuarios.find((u) => u.usuarioId === s.solicitanteId);
        resultados.push({
          tipo: "Solicitud",
          id: s.solicitudId,
          nombre: `Solicitud interárea: ${s.descripcionActividad}`,
          responsable: solicitante?.nombre ?? s.solicitanteId,
          areaId: s.areaRequeridaId,
          score: 20 + Math.min(20, dias),
          razones: [`Solicitud interárea sin respuesta desde hace ${dias} días (estatus: ${s.estatus}).`],
        });
      }
    });

  return resultados.sort((a, b) => b.score - a.score);
}

function esPendiente(s: SolicitudInterarea): boolean {
  return s.estatus === "Pendiente del líder solicitante" || s.estatus === "Pendiente del líder del área requerida" || s.estatus === "Cambios solicitados";
}

function diasEntre(fechaIso: string, hoy: Date): number {
  const f = new Date(fechaIso).getTime();
  return Math.max(0, Math.floor((hoy.getTime() - f) / (1000 * 60 * 60 * 24)));
}

export function actividadMasCritica(cuellos: Cuello[]): Cuello | null {
  return cuellos.length > 0 ? cuellos[0] : null;
}

// re-export type helper used elsewhere
export type { Actividad };
