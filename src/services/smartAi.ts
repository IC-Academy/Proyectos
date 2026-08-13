import type { SmartEvaluacion } from "../types";

// ============================================================================
// "IA simulada" — motor de reglas 100% local (sin llamadas externas) que
// evalúa un objetivo bajo el marco SMART y explica cada calificación.
// ============================================================================

export interface InsumoSmart {
  nombreCorto: string;
  descripcion: string;
  resultadoEsperado: string;
  indicador: string;
  lineaBase: number | null;
  meta: number | null;
  unidad: string;
  fechaInicio: string;
  fechaFin: string;
  relevanciaEstrategica: string;
  evidenciaEsperada: string;
  areas: { areaId: string; nombre: string; ponderacion: number }[];
}

function tieneTexto(t: string | null | undefined, minimo = 8): boolean {
  return !!t && t.trim().length >= minimo;
}

export function evaluarSmart(input: InsumoSmart): SmartEvaluacion {
  const faltantes: string[] = [];

  // S — Específico
  const especificoOk = tieneTexto(input.descripcion, 20) && tieneTexto(input.nombreCorto, 4);
  if (!especificoOk) faltantes.push("Falta una descripción específica de qué se quiere lograr.");

  // M — Medible
  const tieneIndicador = tieneTexto(input.indicador, 3);
  const tieneLineaBase = input.lineaBase !== null && !Number.isNaN(input.lineaBase);
  const tieneMeta = input.meta !== null && !Number.isNaN(input.meta);
  const metaCuantificable = tieneMeta && tieneLineaBase && (input.meta as number) !== (input.lineaBase as number);
  if (!tieneIndicador) faltantes.push("No existe un indicador definido.");
  if (!tieneLineaBase) faltantes.push("Falta la línea base.");
  if (!tieneMeta) faltantes.push("Falta la meta.");
  if (tieneMeta && tieneLineaBase && !metaCuantificable) faltantes.push("La meta no es cuantificable: es igual a la línea base.");
  const medibleOk = tieneIndicador && tieneLineaBase && tieneMeta && metaCuantificable;

  // A — Alcanzable
  const sumaPonderacion = input.areas.reduce((s, a) => s + a.ponderacion, 0);
  const ponderacionesOk = input.areas.length > 0 && Math.abs(sumaPonderacion - 100) <= 0.6;
  if (input.areas.length === 0) faltantes.push("No se asignaron áreas responsables.");
  else if (!ponderacionesOk) faltantes.push(`Las ponderaciones de las áreas suman ${sumaPonderacion}% y deben sumar 100%.`);
  const alcanzableOk = input.areas.length > 0 && ponderacionesOk;

  // R — Relevante
  const relevanteOk = tieneTexto(input.relevanciaEstrategica, 15);
  if (!relevanteOk) faltantes.push("Falta explicar la relevancia estratégica del objetivo.");

  // T — Temporal
  const fechasValidas = !!input.fechaInicio && !!input.fechaFin && new Date(input.fechaFin) > new Date(input.fechaInicio);
  if (!input.fechaFin) faltantes.push("No existe fecha límite.");
  else if (!fechasValidas) faltantes.push("La fecha final debe ser posterior a la fecha inicial.");
  const temporalOk = fechasValidas;

  // Puntaje ponderado: cada componente vale 20 puntos.
  const puntaje = Math.round(
    (especificoOk ? 20 : 6) +
      (medibleOk ? 20 : tieneIndicador || tieneMeta ? 8 : 0) +
      (alcanzableOk ? 20 : input.areas.length > 0 ? 8 : 0) +
      (relevanteOk ? 20 : 6) +
      (temporalOk ? 20 : 6)
  );

  const redaccionSugerida = construirRedaccion(input);

  const bloqueante = !especificoOk || !medibleOk || !alcanzableOk || !temporalOk;

  return {
    puntaje,
    especifico: { ok: especificoOk, mensaje: especificoOk ? "El objetivo describe con claridad qué se quiere lograr." : "Agrega una descripción específica y concreta." },
    medible: { ok: medibleOk, mensaje: medibleOk ? `Indicador "${input.indicador}" con línea base ${input.lineaBase} y meta ${input.meta}.` : "Define indicador, línea base y meta cuantificable." },
    alcanzable: { ok: alcanzableOk, mensaje: alcanzableOk ? `Distribuido entre ${input.areas.length} área(s), ponderación 100%.` : "Asigna al menos un área y ajusta las ponderaciones a 100%." },
    relevante: { ok: relevanteOk, mensaje: relevanteOk ? "La relevancia estratégica está documentada." : "Explica cómo se relaciona con la estrategia general." },
    temporal: { ok: temporalOk, mensaje: temporalOk ? `Del ${input.fechaInicio} al ${input.fechaFin}.` : "Define fecha de inicio y fecha límite válidas." },
    faltantes,
    redaccionSugerida,
    bloqueante,
  };
}

function construirRedaccion(input: InsumoSmart): string {
  const nombres = input.areas.length > 0 ? input.areas.map((a) => a.nombre).join(", ") : "las áreas responsables";
  const indicador = tieneTexto(input.indicador, 1) ? input.indicador : "el indicador definido";
  const lb = input.lineaBase ?? "—";
  const meta = input.meta ?? "—";
  const unidad = input.unidad || "";
  const periodo = input.fechaInicio && input.fechaFin ? `durante el periodo comprendido entre ${formatoLegible(input.fechaInicio)} y ${formatoLegible(input.fechaFin)}` : "en el periodo definido";
  return `Incrementar ${indicador} de ${lb} a ${meta} ${unidad}, ${periodo}, mediante acciones coordinadas de ${nombres}.`;
}

function formatoLegible(fechaIso: string): string {
  try {
    const d = new Date(fechaIso + "T00:00:00");
    return d.toLocaleDateString("es-MX", { month: "long", year: "numeric" });
  } catch {
    return fechaIso;
  }
}
