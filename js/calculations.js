/**
 * calculations.js
 * ---------------------------------------------------------------------------
 * Motor de cálculo de la Evaluación del Desempeño Administrativo (EDD)
 * INTER-CON SERVICIOS DE SEGURIDAD PRIVADA, S.A. DE C.V.
 * Documento fuente: EDD_Inter-Con_Rev4_ponderacion_40_60.docx (FOR-CAP-003 Rev. 4)
 *
 * Todas las reglas numéricas de la evaluación viven en este archivo.
 * No se deben duplicar fórmulas ni umbrales en otros módulos.
 * ---------------------------------------------------------------------------
 */

(function (global) {
  'use strict';

  // ===========================================================================
  // 1. PONDERACIÓN GENERAL
  //
  // Ponderación acordada en demo del 11-08-2026: dos bloques 50/50.
  // Valores y Actitud aporta 50% del total. El bloque técnico-funcional +
  // objetivos aporta el otro 50%. Hasta que RH confirme otro reparto interno,
  // se conserva la proporción previa B:C:D = 20:10:30 (2:1:3), escalada a 50%.
  //
  // Única fuente de verdad de los porcentajes: NO se deben hardcodear
  // porcentajes en app.js, data.js ni en ningún otro módulo. Cualquier
  // pantalla que muestre un peso debe leerlo de aquí (o de data.js, que a su
  // vez reparte estos mismos totales entre las competencias de cada sección).
  // ===========================================================================
  const PESOS_SECCION = {
    actitud: 40,       // Bloque 1 — Valores y Actitud
    habilidades: 30,  // Bloque 2B — Conocimientos y Habilidades Técnicas
    conocimientos: 0, // Compatibilidad interna: Rev.4 integra conocimientos + habilidades en B
    objetivos: 30      // Bloque 2C — Cumplimiento de Objetivos
  };
  // Suma de control Rev.4: 40 + 30 + 30 = 100.

  // ===========================================================================
  // 2. CLASIFICACIÓN NUMÉRICA DEL RESULTADO FINAL (0-100)
  //    Documento oficial + precisión decimal indicada por el cliente.
  // ===========================================================================
  const NIVELES_DESEMPENO = [
    { min: 90, max: 100, nivel: 'Sobresaliente', color: '#1e7e34' },
    { min: 80, max: 89.99, nivel: 'Excede las expectativas', color: '#28a745' },
    { min: 60, max: 79.99, nivel: 'Cumple las expectativas', color: '#3b82c4' },
    { min: 40, max: 59.99, nivel: 'Cumple parcialmente; requiere plan de mejora', color: '#e0a800' },
    { min: -Infinity, max: 39.99, nivel: 'No cumple las expectativas del puesto', color: '#c0392b' }
  ];

  function clasificarNivel(total) {
    if (total === null || total === undefined || isNaN(total)) {
      return { nivel: 'Sin datos', color: '#6c757d' };
    }
    for (const rango of NIVELES_DESEMPENO) {
      if (total >= rango.min && total <= rango.max) {
        return { nivel: rango.nivel, color: rango.color };
      }
    }
    return { nivel: 'Sin datos', color: '#6c757d' };
  }

  // ===========================================================================
  // 3. UMBRALES Y EJES DE LA MATRIZ 9-BOX
  //    Documento oficial Rev4: ambos ejes se convierten a base 100.
  //    Nivel 1: <60 · Nivel 2: 60-79 · Nivel 3: 80-100.
  // ===========================================================================
  const CONFIG_9BOX = {
    ejeVertical: 'Actitud',
    ejeHorizontal: 'Desempeño',
    etiquetasNivel: ['Bajo', 'Medio / esperado', 'Alto'],
    nivel1MaxBase100: 59.9999,
    nivel2MaxBase100: 79.9999,
    nivel3MaxBase100: 100
  };

  // Umbrales de comparación de brechas entre autoevaluación y evaluación del líder.
  // Editable / configurable, no debe quedar incrustado en la interfaz.
  const CONFIG_BRECHA = {
    alineadaMax: 0.49,   // 0 a 0.49 = Alineada
    revisarMax: 0.99     // 0.50 a 0.99 = Revisar ; >=1 = Brecha significativa
  };

  // ===========================================================================
  // 4. INFORMACIÓN DE LOS 9 CUADRANTES (documento oficial, secciones V y VI)
  //    cuadrante = (nivelDesempeno - 1) * 3 + nivelActitud
  // ===========================================================================
  const CUADRANTES_INFO = {
    1: {
      numero: 1, nombre: 'Black Spot',
      significado: 'No tiene la actitud ni los conocimientos requeridos para su posición.',
      accion: 'No Inter-Con — con plan de acción inmediato y mejora en un mes; de lo contrario, debe salir de la empresa.',
      color: '#c0392b', prioridad: 'Crítica', seguimiento: 'Revisión en 1 mes'
    },
    2: {
      numero: 2, nombre: 'Sembrando',
      significado: 'Mejor actitud que desempeño.',
      accion: 'Requiere plan claro de capacitación en sus áreas de posibilidad; evaluar en 3 meses.',
      color: '#e0731c', prioridad: 'Alta', seguimiento: 'Revisión en 3 meses'
    },
    3: {
      numero: 3, nombre: 'Semilla',
      significado: 'Actitud positiva, pero desempeño bajo.',
      accion: 'Potencial Gente Inter-Con — plan de capacitación técnica y evaluación en 3 meses mostrando mejora.',
      color: '#e0a800', prioridad: 'Alta', seguimiento: 'Revisión en 3 meses'
    },
    4: {
      numero: 4, nombre: 'En Maceta',
      significado: 'Trabajo positivo, pero resultados aún por debajo del estándar.',
      accion: 'Debe trabajar su actitud; se sugiere plan de coaching y evaluación cada 3 meses.',
      color: '#e0a800', prioridad: 'Media-Alta', seguimiento: 'Coaching cada 3 meses'
    },
    5: {
      numero: 5, nombre: 'Sol',
      significado: 'En la mitad — OK.',
      accion: 'OK — está en su zona de confort y hace bien su trabajo con actitud positiva.',
      color: '#3b82c4', prioridad: 'Media', seguimiento: 'Seguimiento en el próximo periodo'
    },
    6: {
      numero: 6, nombre: 'Cosecha',
      significado: 'Buena actitud y desempeño promedio; buen potencial de crecimiento.',
      accion: 'Guardián — capacidad para un puesto de liderazgo en la empresa.',
      color: '#4caf50', prioridad: 'Media', seguimiento: 'Plan de crecimiento'
    },
    7: {
      numero: 7, nombre: 'Agua',
      significado: 'Actitud negativa, pero desempeño superior al promedio.',
      accion: 'Debe trabajar su actitud para crecer en Inter-Con; hacer un plan o considerar retiro en el corto plazo.',
      color: '#e0731c', prioridad: 'Alta', seguimiento: 'Plan de actitud en el corto plazo'
    },
    8: {
      numero: 8, nombre: 'Corazón',
      significado: 'Por encima del promedio; tiene capacidad y actitud.',
      accion: 'Crecimiento — listo para una posición de liderazgo en el corto plazo.',
      color: '#2e7d32', prioridad: 'Alta', seguimiento: 'Plan de crecimiento en el corto plazo'
    },
    9: {
      numero: 9, nombre: 'Green Spot',
      significado: 'Cumple a satisfacción tanto en actitud como en desempeño.',
      accion: 'Alto Potencial — estrella de Inter-Con, lista para promoción inmediata.',
      color: '#1b5e20', prioridad: 'Alta', seguimiento: 'Promoción inmediata'
    }
  };

  // ===========================================================================
  // 5. UTILIDADES DE PROMEDIO EXCLUYENDO N/A
  // ===========================================================================

  /**
   * Calcula el promedio de un arreglo de calificaciones (1-5) excluyendo N/A.
   * N/A NUNCA se convierte a 0, ni reduce el promedio: simplemente se excluye
   * del denominador. Si no hay ninguna calificación válida, retorna null.
   */
  function promedioValido(valores) {
    const validos = (valores || []).filter((v) => v !== 'N/A' && v !== null && v !== undefined && v !== '' && !isNaN(Number(v)));
    if (validos.length === 0) return null;
    const suma = validos.reduce((acc, v) => acc + Number(v), 0);
    return suma / validos.length;
  }

  /**
   * Puntaje de sección = (promedio de calificaciones válidas / 5) * peso de la sección
   * Si no hay calificaciones válidas, el puntaje de esa sección es 0 y se marca sinDatos.
   */
  function puntajeSeccion(promedio, peso) {
    if (promedio === null || promedio === undefined) {
      return { puntaje: 0, sinDatos: true };
    }
    return { puntaje: (promedio / 5) * peso, sinDatos: false };
  }

  function round1(n) {
    if (n === null || n === undefined || isNaN(n)) return null;
    return Math.round(n * 10) / 10;
  }

  // ===========================================================================
  // 6. CÁLCULO COMPLETO DE UNA EVALUACIÓN
  //    Recibe respuestas (por sección) y objetivos, entrega puntajes completos.
  // ===========================================================================

  /**
   * respuestasPorSeccion: { actitud: [valores], habilidades: [valores], conocimientos: [valores] }
   * objetivos: [{ descripcion, resultado, calificacion }]  (calificacion puede ser 1-5 o 'N/A')
   */
  function calcularResultado(respuestasPorSeccion, objetivos) {
    const valoresA = (respuestasPorSeccion.actitud || []).map((r) => r.valor);
    const valoresB = (respuestasPorSeccion.habilidades || []).map((r) => r.valor);
    const valoresC = (respuestasPorSeccion.conocimientos || []).map((r) => r.valor);

    // Solo objetivos registrados (con descripción) y con calificación válida entran al promedio.
    const valoresD = (objetivos || [])
      .filter((o) => o && o.descripcion && String(o.descripcion).trim() !== '')
      .map((o) => o.calificacion);

    const avgA = promedioValido(valoresA);
    const avgB = promedioValido(valoresB);
    const avgC = promedioValido(valoresC);
    const avgD = promedioValido(valoresD);

    const secA = puntajeSeccion(avgA, PESOS_SECCION.actitud);
    const secB = puntajeSeccion(avgB, PESOS_SECCION.habilidades);
    const secC = puntajeSeccion(avgC, PESOS_SECCION.conocimientos);
    const secD = puntajeSeccion(avgD, PESOS_SECCION.objetivos);

    const total = secA.puntaje + secB.puntaje + secC.puntaje + secD.puntaje;

    // Eje DESEMPEÑO Rev.4 = Técnica Funcional (B) + Objetivos (C), expresado en escala 1-5.
    const pesosDesempeno = [
      { avg: avgB, peso: PESOS_SECCION.habilidades },
      { avg: avgD, peso: PESOS_SECCION.objetivos }
    ].filter((x) => x.avg !== null && x.peso > 0);
    const pesoTotalDesempeno = pesosDesempeno.reduce((acc, x) => acc + x.peso, 0);
    const desempenoProm = pesoTotalDesempeno > 0
      ? pesosDesempeno.reduce((acc, x) => acc + x.avg * x.peso, 0) / pesoTotalDesempeno
      : null;

    return {
      promedios: { actitud: avgA, habilidades: avgB, conocimientos: avgC, objetivos: avgD, desempeno: desempenoProm },
      puntajes: {
        actitud: round1(secA.puntaje),
        habilidades: round1(secB.puntaje),
        conocimientos: round1(secC.puntaje),
        objetivos: round1(secD.puntaje),
        total: round1(total)
      },
      sinDatos: { actitud: secA.sinDatos, habilidades: secB.sinDatos, conocimientos: secC.sinDatos, objetivos: secD.sinDatos },
      nivel: clasificarNivel(total)
    };
  }

  /** Equivalencia oficial Rev.4 de porcentaje de cumplimiento a calificación. */
  function calificacionPorCumplimiento(porcentaje) {
    if (porcentaje === 'N/A') return 'N/A';
    if (porcentaje === null || porcentaje === undefined || porcentaje === '' || isNaN(Number(porcentaje))) return null;
    const p = Number(porcentaje);
    if (p >= 110) return 5;
    if (p >= 100) return 4;
    if (p >= 90) return 3;
    if (p >= 75) return 2;
    return 1;
  }

  // ===========================================================================
  // 7. ASIGNACIÓN DE CUADRANTE 9-BOX
  // ===========================================================================

  function nivelEje(promedio) {
    if (promedio === null || promedio === undefined) return null;
    const base100 = (Number(promedio) / 5) * 100;
    if (base100 < 60) return 1;
    if (base100 < 80) return 2;
    return 3;
  }

  /**
   * actitudProm: promedio 1-5 de la sección A (Valores y Actitud), convertido
   *   a base 100 para determinar el nivel del eje ACTITUD.
   * desempenoProm: promedio ponderado 1-5 de B+C (Técnica Funcional + Objetivos), usando pesos 30/30 de Rev.4.
   * Fórmula validada contra el documento oficial:
   *   cuadrante = (nivelDesempeno - 1) * 3 + nivelActitud
   */
  function asignarCuadrante(actitudProm, desempenoProm) {
    const nA = nivelEje(actitudProm);
    const nD = nivelEje(desempenoProm);
    if (nA === null || nD === null) {
      return { cuadrante: null, nivelActitud: nA, nivelDesempeno: nD, info: null };
    }
    const numero = (nD - 1) * 3 + nA;
    return { cuadrante: numero, nivelActitud: nA, nivelDesempeno: nD, info: CUADRANTES_INFO[numero] };
  }

  // ===========================================================================
  // 8. COMPARACIÓN AUTOEVALUACIÓN vs. EVALUACIÓN DEL LÍDER
  // ===========================================================================

  function clasificarBrecha(diferenciaAbs) {
    if (diferenciaAbs === null || diferenciaAbs === undefined || isNaN(diferenciaAbs)) {
      return { etiqueta: 'Sin datos', color: '#6c757d' };
    }
    const d = Math.abs(diferenciaAbs);
    if (d <= CONFIG_BRECHA.alineadaMax) return { etiqueta: 'Alineada', color: '#28a745' };
    if (d <= CONFIG_BRECHA.revisarMax) return { etiqueta: 'Revisar', color: '#e0a800' };
    return { etiqueta: 'Brecha significativa', color: '#c0392b' };
  }

  // ===========================================================================
  // EXPORTS
  // ===========================================================================
  global.EDDCalc = {
    PESOS_SECCION,
    NIVELES_DESEMPENO,
    CONFIG_9BOX,
    CONFIG_BRECHA,
    CUADRANTES_INFO,
    promedioValido,
    puntajeSeccion,
    round1,
    calcularResultado,
    calificacionPorCumplimiento,
    clasificarNivel,
    nivelEje,
    asignarCuadrante,
    clasificarBrecha
  };
})(window);
