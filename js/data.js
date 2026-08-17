/**
 * data.js
 * ---------------------------------------------------------------------------
 * Catálogo maestro de la Evaluación del Desempeño Administrativo (EDD)
 * Fuente: EDD_Inter-Con_Rev4_ponderacion_40_60.docx (FOR-CAP-003 Rev. 4)
 *
 * Contiene: escala de evaluación, competencias y conductas observables por
 * sección, ponderaciones, datos de usuarios de demostración y un generador
 * determinista de respuestas simuladas para poblar el localStorage la
 * primera vez que se abre la demo.
 * ---------------------------------------------------------------------------
 */

(function (global) {
  'use strict';

  // ===========================================================================
  // ESCALA DE EVALUACIÓN (documento oficial, tabla "ESCALA DE EVALUACIÓN")
  // ===========================================================================
  const ESCALA = [
    { valor: 5, descripcion: 'Excede significativamente las expectativas. Es un referente para otros.' },
    { valor: 4, descripcion: 'Supera las expectativas de manera constante.' },
    { valor: 3, descripcion: 'Cumple con lo esperado para su puesto.' },
    { valor: 2, descripcion: 'Cumple parcialmente; requiere mejorar.' },
    { valor: 1, descripcion: 'No cumple con las expectativas del puesto.' },
    { valor: 'N/A', descripcion: 'No aplica o no cuento con elementos suficientes para evaluarlo.' }
  ];

  // ===========================================================================
  // SECCIONES Y COMPETENCIAS
  // Ponderación oficial Rev. 4: 40% Valores/Actitud + 30% Técnica Funcional + 30% Objetivos.
  // ===========================================================================
  const SECCIONES_META = {
    actitud: { titulo: 'A. Valores y Actitud', peso: 40, eje: 'ACTITUD', descripcion: 'Evalúa la vivencia diaria de los valores ESPÍRITU de Inter-Con y la forma en que el colaborador se conduce con las personas. Esta sección determina el eje ACTITUD del 9-box.' },
    habilidades: { titulo: 'B. Conocimientos y Habilidades Técnicas del Puesto', peso: 30, eje: 'DESEMPEÑO', descripcion: 'Evalúa el dominio técnico del puesto, el uso de procesos y herramientas del área y la forma en que el colaborador organiza y controla su trabajo.' },
    conocimientos: { titulo: 'Sección interna no utilizada', peso: 0, eje: 'DESEMPEÑO', descripcion: '' },
    objetivos: { titulo: 'C. Cumplimiento de Objetivos', peso: 30, eje: 'DESEMPEÑO', descripcion: 'Registra hasta cinco objetivos acordados al inicio del periodo, con su meta o indicador, resultado alcanzado, porcentaje de cumplimiento y calificación.' }
  };

  const COMPETENCIAS = {
    actitud: [
      {
        id: 'A1', nombre: 'Compromiso Organizacional (Integridad y Excelencia)', peso: 8,
        conductas: [
          'Actúa conforme a los valores ESPÍRITU de Inter-Con.',
          'Muestra responsabilidad y ética profesional.',
          'Se involucra activamente en los objetivos de la empresa.',
          'Es puntual, constante y cumple los compromisos que asume.'
        ]
      },
      {
        id: 'A2', nombre: 'Actitud de Servicio (Pasión y Respeto)', peso: 8,
        conductas: [
          'Atiende oportunamente las solicitudes de clientes internos y externos.',
          'Demuestra disposición y pasión para apoyar a otros.',
          'Actúa con profesionalismo, respeto y empatía.'
        ]
      },
      {
        id: 'A3', nombre: 'Trabajo en Equipo, Unión y Desarrollo de Otros', peso: 8,
        conductas: [
          'Colabora con otras áreas para lograr objetivos comunes.',
          'Mantiene relaciones laborales basadas en el respeto y contribuye a resolver diferencias de manera constructiva.',
          'Comparte conocimientos y brinda apoyo cuando otros lo requieren.',
          'Favorece un ambiente de aprendizaje y colaboración.'
        ]
      },
      {
        id: 'A4', nombre: 'Comunicación Efectiva y Apertura', peso: 8,
        conductas: [
          'Se comunica de forma clara, respetuosa y oportuna.',
          'Escucha activamente y considera diferentes puntos de vista.',
          'Comparte información relevante para facilitar el trabajo de los demás.',
          'Recibe la retroalimentación con disposición para mejorar.'
        ]
      },
      {
        id: 'A5', nombre: 'Adaptabilidad, Iniciativa y Compromiso con la Sustentabilidad', peso: 8,
        conductas: [
          'Se adapta positivamente a cambios y nuevas prioridades.',
          'Propone ideas para mejorar procesos y toma la iniciativa cuando es necesario.',
          'Hace uso responsable de los recursos materiales y energéticos a su cargo.',
          'Promueve prácticas de cuidado ambiental y ahorro de recursos en su área de trabajo.'
        ]
      }
    ],
    habilidades: [
      {
        id: 'B1', nombre: 'Dominio del Puesto', peso: 6,
        conductas: [
          'Aplica correctamente los conocimientos técnicos y normativos de su puesto.',
          'Resuelve problemas relacionados con sus funciones.',
          'Mantiene actualizados sus conocimientos técnicos y las herramientas propias de su puesto.'
        ]
      },
      {
        id: 'B2', nombre: 'Procesos y Herramientas de Trabajo', peso: 6,
        conductas: [
          'Conoce y aplica correctamente los procesos, políticas y procedimientos de su área.',
          'Utiliza con eficiencia las herramientas y sistemas de uso general en Inter-Con: Excel, Office, Outlook, Teams, Concur y las plataformas internas que apliquen a su puesto.',
          'Considera el cuadro de apoyo de herramientas para determinar el nivel de dominio aplicable al puesto.'
        ]
      },
      {
        id: 'B3', nombre: 'Orientación a Resultados y Calidad', peso: 6,
        conductas: [
          'Cumple consistentemente los objetivos y estándares establecidos.',
          'Mantiene altos estándares de calidad y precisión en su trabajo.',
          'Propone acciones para mejorar la productividad y la eficiencia.'
        ]
      },
      {
        id: 'B4', nombre: 'Planeación y Organización', peso: 6,
        conductas: [
          'Organiza adecuadamente sus actividades y prioridades.',
          'Cumple los plazos establecidos.',
          'Anticipa riesgos y establece acciones preventivas.'
        ]
      },
      {
        id: 'B5', nombre: 'Seguimiento, Control y Uso de Recursos', peso: 6,
        conductas: [
          'Da seguimiento oportuno a sus actividades y compromisos.',
          'Cumple políticas y procedimientos internos, así como los requisitos de la documentación a su cargo.',
          'Administra adecuadamente los recursos asignados.'
        ]
      }
    ],
    conocimientos: []
  };


  // ===========================================================================
  // NIVELES DE DESEMPEÑO (referencia visual, la fuente de verdad numérica
  // vive en calculations.js -> NIVELES_DESEMPENO)
  // ===========================================================================
  const REFERENCIA_NIVELES = [
    { rango: '90 – 100', nivel: 'Sobresaliente' },
    { rango: '80 – 89', nivel: 'Excede las expectativas' },
    { rango: '60 – 79', nivel: 'Cumple las expectativas' },
    { rango: '40 – 59', nivel: 'Cumple parcialmente; requiere plan de mejora' },
    { rango: 'Menor a 40', nivel: 'No cumple las expectativas del puesto' }
  ];

  // ===========================================================================
  // ESTADOS DEL PROCESO
  // ===========================================================================
  const ESTADOS = {
    NO_INICIADA: 'No iniciada',
    EN_PROGRESO: 'En progreso',
    COMPLETADA: 'Completada',
    PENDIENTE_LIDER: 'Pendiente de líder',
    PENDIENTE_CALIBRACION: 'Pendiente de calibración',
    CALIBRADA: 'Calibrada',
    RETRO_PENDIENTE: 'Retroalimentación pendiente',
    CERRADA: 'Cerrada'
  };

  // ===========================================================================
  // PERIODO ACTIVO
  // ===========================================================================
  const PERIODOS = [
    {
      id: 'PER-2026-01',
      nombre: 'Evaluación de Desempeño Administrativo 2026',
      fechaInicio: '2026-06-01',
      fechaFin: '2026-08-31',
      fechaLimiteAutoevaluacion: '2026-07-15',
      fechaLimiteLider: '2026-07-31',
      activo: true,
      faseRetroalimentacionHabilitada: {} // se llena por colaboradorId cuando RH habilita
    }
  ];

  // ===========================================================================
  // USUARIOS / COLABORADORES / LÍDERES DE DEMOSTRACIÓN
  // ===========================================================================
  const LIDERES = [
    { empleado: '20001', nombre: 'Carlos Martínez', puesto: 'Gerente de Recursos Humanos', area: 'Recursos Humanos', ciudad: 'Ciudad de México', correoCorporativo: 'carlos.martinez@intercon.com.mx', estatusEmpleado: 'Activo', correoValidado: true, ultimaActualizacion: '2026-07-20' },
    { empleado: '20002', nombre: 'Ana Torres', puesto: 'Gerente de Finanzas', area: 'Finanzas', ciudad: 'Guadalajara', correoCorporativo: 'ana.torres@intercon.com.mx', estatusEmpleado: 'Activo', correoValidado: true, ultimaActualizacion: '2026-07-20' },
    { empleado: '20003', nombre: 'Roberto Díaz', puesto: 'Gerente de Operaciones', area: 'Operaciones', ciudad: 'Monterrey', correoCorporativo: 'roberto.diaz@intercon.com.mx', estatusEmpleado: 'Activo', correoValidado: true, ultimaActualizacion: '2026-07-20' },
    { empleado: '20004', nombre: 'Sofía López', puesto: 'Gerente de Tecnología', area: 'Tecnología', ciudad: 'Ciudad de México', correoCorporativo: 'sofia.lopez@intercon.com.mx', estatusEmpleado: 'Activo', correoValidado: true, ultimaActualizacion: '2026-07-20' },
    { empleado: '20005', nombre: 'Miguel Ángel Ruiz', puesto: 'Gerente Comercial', area: 'Comercial', ciudad: 'Puebla', correoCorporativo: 'miguel.ruiz@intercon.com.mx', estatusEmpleado: 'Activo', correoValidado: true, ultimaActualizacion: '2026-07-20' }
  ];

  const ADMINISTRADORES = [
    { empleado: '90001', nombre: 'Administrador RH', puesto: 'Administrador de RH', area: 'Recursos Humanos', correoCorporativo: 'rh.admin@intercon.com.mx', estatusEmpleado: 'Activo', correoValidado: true, ultimaActualizacion: '2026-07-20' }
  ];

  // perfilObjetivo: valores de referencia (1-5) usados por el generador de respuestas
  // simuladas para poder mostrar distintos cuadrantes 9-box en la demo.
  const COLABORADORES = [
    { empleado: '10001', nombre: 'Laura Hernández', puesto: 'Analista de Recursos Humanos', area: 'Recursos Humanos', liderId: '20001', antiguedad: '2 años 4 meses', ciudad: 'Ciudad de México', direccion: 'Dirección Corporativa', estadoDemo: 'no_iniciada', correoCorporativo: 'laura.hernandez@intercon.com.mx', estatusEmpleado: 'Activo', correoValidado: true, ultimaActualizacion: '2026-07-20' },
    { empleado: '10002', nombre: 'Jorge Ramírez', puesto: 'Coordinador de Nómina', area: 'Recursos Humanos', liderId: '20001', antiguedad: '1 año 2 meses', ciudad: 'Ciudad de México', direccion: 'Dirección Corporativa', estadoDemo: 'pendiente_lider', perfilObjetivo: { actitud: 4.2, habilidades: 3.8, conocimientos: 4.0, objetivos: 4.0 }, correoCorporativo: 'jorge.ramirez@intercon.com.mx', estatusEmpleado: 'Activo', correoValidado: true, ultimaActualizacion: '2026-07-20' },
    { empleado: '10003', nombre: 'Fernanda Gómez', puesto: 'Analista Contable', area: 'Finanzas', liderId: '20002', antiguedad: '3 años', ciudad: 'Guadalajara', direccion: 'Dirección Administrativa', estadoDemo: 'pendiente_calibracion', perfilObjetivo: { actitud: 4.6, habilidades: 4.4, conocimientos: 4.5, objetivos: 4.3 }, perfilObjetivoLider: { actitud: 4.3, habilidades: 4.0, conocimientos: 4.2, objetivos: 4.0 }, correoCorporativo: 'fernanda.gomez@intercon.com.mx', estatusEmpleado: 'Activo', correoValidado: true, ultimaActualizacion: '2026-07-20' },
    { empleado: '10004', nombre: 'Diego Morales', puesto: 'Analista de Tesorería', area: 'Finanzas', liderId: '20002', antiguedad: '8 meses', ciudad: 'Guadalajara', direccion: 'Dirección Administrativa', estadoDemo: 'retro_pendiente', perfilObjetivo: { actitud: 4.0, habilidades: 3.2, conocimientos: 3.0, objetivos: 3.3 }, perfilObjetivoLider: { actitud: 4.3, habilidades: 2.2, conocimientos: 2.3, objetivos: 2.0 }, correoCorporativo: 'diego.morales@intercon.com.mx', estatusEmpleado: 'Activo', correoValidado: true, ultimaActualizacion: '2026-07-20' },
    { empleado: '10005', nombre: 'Patricia Reyes', puesto: 'Supervisora de Zona', area: 'Operaciones', liderId: '20003', antiguedad: '5 años', ciudad: 'Monterrey', direccion: 'Dirección de Operaciones', estadoDemo: 'cerrada', perfilObjetivo: { actitud: 3.7, habilidades: 4.7, conocimientos: 4.6, objetivos: 4.7 }, perfilObjetivoLider: { actitud: 3.5, habilidades: 4.6, conocimientos: 4.5, objetivos: 4.6 }, correoCorporativo: 'patricia.reyes@intercon.com.mx', estatusEmpleado: 'Activo', correoValidado: true, ultimaActualizacion: '2026-07-20' },
    { empleado: '10006', nombre: 'Héctor Vargas', puesto: 'Coordinador Operativo', area: 'Operaciones', liderId: '20003', antiguedad: '1 año', ciudad: 'Monterrey', direccion: 'Dirección de Operaciones', estadoDemo: 'no_iniciada', correoCorporativo: 'hector.vargas@intercon.com.mx', estatusEmpleado: 'Activo', correoValidado: true, ultimaActualizacion: '2026-07-20' },
    { empleado: '10007', nombre: 'Daniela Cruz', puesto: 'Analista de Sistemas', area: 'Tecnología', liderId: '20004', antiguedad: '2 años', ciudad: 'Ciudad de México', direccion: 'Dirección de Tecnología', estadoDemo: 'en_progreso', correoCorporativo: 'daniela.cruz@intercon.com.mx', estatusEmpleado: 'Activo', correoValidado: true, ultimaActualizacion: '2026-07-20' },
    { empleado: '10008', nombre: 'Andrés Ortiz', puesto: 'Soporte Técnico Sr.', area: 'Tecnología', liderId: '20004', antiguedad: '5 meses', ciudad: 'Ciudad de México', direccion: 'Dirección de Tecnología', estadoDemo: 'cerrada', perfilObjetivo: { actitud: 1.8, habilidades: 2.2, conocimientos: 2.0, objetivos: 1.9 }, perfilObjetivoLider: { actitud: 1.6, habilidades: 1.9, conocimientos: 1.8, objetivos: 1.7 }, correoCorporativo: 'andres.ortiz@intercon.com.mx', estatusEmpleado: 'Activo', correoValidado: false, ultimaActualizacion: '2026-07-18' },
    // Caso "brecha significativa": la colaboradora se autopercibe con actitud sobresaliente,
    // pero el líder documenta una actitud deficiente pese a un desempeño técnico sólido
    // (Habilidades/Conocimientos/Objetivos alineados). Cuadrante resultante: Agua (7).
    { empleado: '10009', nombre: 'Valeria Sánchez', puesto: 'Ejecutiva de Cuenta', area: 'Comercial', liderId: '20005', antiguedad: '4 años', ciudad: 'Puebla', direccion: 'Dirección Comercial', estadoDemo: 'pendiente_calibracion', perfilObjetivo: { actitud: 4.5, habilidades: 4.4, conocimientos: 4.2, objetivos: 4.5 }, perfilObjetivoLider: { actitud: 1.8, habilidades: 4.3, conocimientos: 4.3, objetivos: 4.5 }, correoCorporativo: 'valeria.sanchez@intercon.com.mx', estatusEmpleado: 'Activo', correoValidado: true, ultimaActualizacion: '2026-07-20' },
    { empleado: '10010', nombre: 'Ricardo Paredes', puesto: 'Coordinador Comercial', area: 'Comercial', liderId: '20005', antiguedad: '1 año 6 meses', ciudad: 'Puebla', direccion: 'Dirección Comercial', estadoDemo: 'cerrada', perfilObjetivo: { actitud: 4.4, habilidades: 3.6, conocimientos: 3.5, objetivos: 3.4 }, perfilObjetivoLider: { actitud: 4.2, habilidades: 3.4, conocimientos: 3.3, objetivos: 3.2 }, correoCorporativo: 'ricardo.paredes@intercon.com.mx', estatusEmpleado: 'Activo', correoValidado: true, ultimaActualizacion: '2026-07-20' },
    // Caso nuevo de beta 3, aditivo: colaborador SIN líder asignado en el Excel
    // maestro (ver requerimiento 18 del brief — "Sin líder asignado"). No
    // afecta ningún escenario previo: su evaluación sigue "no_iniciada" y no
    // participa en flujos de líder/comparación/calibración.
    { empleado: '10011', nombre: 'Mario Castillo', puesto: 'Analista Junior de Operaciones', area: 'Operaciones', liderId: null, antiguedad: '3 meses', ciudad: 'Monterrey', direccion: 'Dirección de Operaciones', estadoDemo: 'no_iniciada', correoCorporativo: null, estatusEmpleado: 'Activo', correoValidado: false, ultimaActualizacion: '2026-07-25' }
  ];

  // ===========================================================================
  // JERARQUÍAS (tabla "Asignaciones" del Excel maestro / Airtable, ver brief
  // sección 8). Se deriva de COLABORADORES.liderId para no duplicar la fuente
  // de verdad de la relación líder-colaborador (que sigue viviendo ahí, tal
  // como en beta 1/2). Esta tabla es solo la proyección con la forma exacta
  // que tendrá el registro real de Airtable/Excel.
  // ===========================================================================
  const JERARQUIAS = COLABORADORES.map((c, idx) => ({
    idAsignacion: 'ASG-2026-' + String(idx + 1).padStart(4, '0'),
    numeroEmpleado: c.empleado,
    numeroLider: c.liderId || null,
    periodo: 'EDD-2026',
    fechaInicio: '2026-08-01',
    fechaFin: null,
    asignacionActiva: true,
    tipoAsignacion: 'Líder directo'
  }));

  // ===========================================================================
  // GENERADOR DETERMINISTA DE RESPUESTAS SIMULADAS (para poblar la demo)
  // ===========================================================================

  // PRNG determinista (mulberry32) para que la demo sea reproducible.
  function crearRng(semilla) {
    let a = semilla >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function claseHash(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) { h = (h * 31 + str.charCodeAt(i)) | 0; }
    return h >>> 0;
  }

  /**
   * Genera respuestas simuladas para un conjunto de competencias, con
   * variación alrededor de un valor objetivo, e incluye ocasionalmente N/A
   * para poder demostrar la exclusión de N/A del cálculo.
   */
  function generarRespuestas(competencias, valorObjetivo, semillaTexto, incluirNA) {
    const rng = crearRng(claseHash(semillaTexto));
    return competencias.map((c, idx) => {
      if (incluirNA && idx === competencias.length - 1 && rng() < 0.3) {
        return { competenciaId: c.id, valor: 'N/A', comentario: 'Sin elementos suficientes para evaluar en este periodo.' };
      }
      const variacion = (rng() - 0.5) * 1.2;
      let v = Math.round(valorObjetivo + variacion);
      v = Math.max(1, Math.min(5, v));
      return { competenciaId: c.id, valor: v, comentario: '' };
    });
  }

  const OBJETIVOS_MUESTRA = [
    ['Reducir el tiempo de respuesta a solicitudes internas en un 15%.', 'Se redujo el tiempo de respuesta en 18%, superando la meta.'],
    ['Actualizar el 100% de los expedientes del área durante el trimestre.', 'Se actualizó el 95% de los expedientes; quedaron pendientes 2 casos especiales.'],
    ['Implementar un tablero de seguimiento mensual para el equipo.', 'Tablero implementado y en uso desde el segundo mes del periodo.'],
    ['Capacitar al equipo en el nuevo procedimiento operativo.', 'Se capacitó al 100% del equipo con evaluación de conocimientos aprobatoria.'],
    ['Disminuir incidencias reportadas por el cliente interno.', 'Las incidencias bajaron de 12 a 6 en el periodo evaluado.']
  ];

  function generarObjetivos(valorObjetivo, semillaTexto, cantidad) {
    const rng = crearRng(claseHash(semillaTexto + '-obj'));
    const n = cantidad || (3 + Math.floor(rng() * 3)); // 3 a 5 objetivos
    const objetivos = [];
    for (let i = 0; i < Math.min(n, 5); i++) {
      const variacion = (rng() - 0.5) * 1.2;
      let v = Math.round(valorObjetivo + variacion);
      v = Math.max(1, Math.min(5, v));
      objetivos.push({
        descripcion: OBJETIVOS_MUESTRA[i][0],
        resultado: OBJETIVOS_MUESTRA[i][1],
        calificacion: v
      });
    }
    return objetivos;
  }

  // ===========================================================================
  // EXPORTS
  // ===========================================================================
  global.EDDData = {
    ESCALA,
    SECCIONES_META,
    COMPETENCIAS,
    REFERENCIA_NIVELES,
    ESTADOS,
    PERIODOS,
    LIDERES,
    ADMINISTRADORES,
    COLABORADORES,
    JERARQUIAS,
    generarRespuestas,
    generarObjetivos,
    crearRng,
    claseHash
  };
})(window);
