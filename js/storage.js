/**
 * storage.js
 * ---------------------------------------------------------------------------
 * Capa de persistencia (localStorage) de la demo EDD Inter-Con.
 *
 * Entidades (ver sección 20 del brief): usuarios, colaboradores, lideres,
 * periodos, evaluaciones, respuestas, objetivos, resultados, calibraciones,
 * cuadrantes, planes_desarrollo, areas_oportunidad, acciones, evidencias,
 * auditoria, configuracion.
 *
 * Este archivo NO contiene reglas de negocio de cálculo (eso vive en
 * calculations.js). Aquí solo se guarda/recupera y se arma la semilla inicial
 * usando el catálogo de data.js + el motor de calculations.js.
 *
 * Arquitectura preparada para migración: todas las funciones públicas
 * (EDDStorage.*) son el único punto de contacto entre la UI y los datos.
 * Sustituir el cuerpo de estas funciones por llamadas fetch() a una API real
 * (Airtable / SQL vía n8n, ver README) no requeriría cambios en app.js.
 * ---------------------------------------------------------------------------
 */

(function (global) {
  'use strict';

  // v2 (beta ponderaciones 50/20/15/15): se sube la versión de la clave de
  // localStorage a propósito. La beta anterior (v1) pudo dejar `resultados`
  // guardados en el navegador calculados con las ponderaciones viejas
  // (Actitud 40 / Habilidades 20 / Conocimientos 10 / Objetivos 30). Si
  // reutilizáramos la misma clave, un usuario que ya probó la v1 vería
  // puntajes/cuadrantes desactualizados mezclados con la lógica nueva sin
  // volver a calcularlos. Cambiar la clave fuerza una semilla limpia con la
  // nueva ponderación la primera vez que se abre esta beta en ese navegador;
  // no se intenta migrar/recalcular los datos viejos porque esta es una
  // demo sin backend (ver README, sección "Modelo de datos").
  //
  // v5 (acuerdo demo 11-08-2026 — ponderación por bloques 50/50): se fuerza
  // semilla limpia para recalcular resultados y 9-box con el nuevo esquema.
  //
  // v3 (beta 3 — preparación Airtable/n8n): el modelo de datos de usuarios
  // cambió de forma incompatible con v2 (se agregan correoCorporativo,
  // estatusEmpleado, correoValidado, ultimaActualizacion en colaboradores/
  // líderes/administradores; se agrega la tabla `jerarquias`; se agrega un
  // colaborador sin líder asignado para poder demostrar la vista
  // administrativa correspondiente). Un `db` v2 cacheado no tendría estos
  // campos, así que se vuelve a subir la versión para forzar una semilla
  // limpia. La SESIÓN (login) es independiente de esto: vive en
  // sessionStorage bajo APP_CONFIG.sessionStorageKey (ver auth.js), no en
  // esta clave de localStorage.
  const STORAGE_KEY = 'edd_interconn_db_v5_demo_50_50';
  let _db = null; // caché en memoria

  // ===========================================================================
  // SEMILLA INICIAL
  // ===========================================================================
  function buildSeedDB() {
    const D = global.EDDData;
    const C = global.EDDCalc;
    const periodo = JSON.parse(JSON.stringify(D.PERIODOS[0]));
    periodo.faseRetroalimentacionHabilitada = {};

    const db = {
      version: 1,
      usuarios: [],
      colaboradores: [],
      lideres: [],
      administradores: [],
      jerarquias: D.JERARQUIAS.map((j) => Object.assign({}, j)),
      periodos: [periodo],
      evaluaciones: [],
      respuestas: [],
      objetivos: [],
      resultados: [],
      calibraciones: [],
      cuadrantes: Object.values(C.CUADRANTES_INFO),
      planes_desarrollo: [],
      areas_oportunidad: [],
      acciones: [],
      evidencias: [],
      auditoria: [],
      configuracion: {
        pesosSeccion: C.PESOS_SECCION,
        escala: D.ESCALA,
        config9box: C.CONFIG_9BOX,
        configBrecha: C.CONFIG_BRECHA,
        nivelesDesempeno: D.REFERENCIA_NIVELES
      }
    };

    const periodoId = periodo.id;

    D.LIDERES.forEach((l) => {
      db.usuarios.push({ empleado: l.empleado, nombre: l.nombre, perfil: 'lider' });
      db.lideres.push(Object.assign({}, l));
    });
    D.ADMINISTRADORES.forEach((a) => {
      db.usuarios.push({ empleado: a.empleado, nombre: a.nombre, perfil: 'administrador' });
      db.administradores.push(Object.assign({}, a));
    });
    D.COLABORADORES.forEach((col) => {
      db.usuarios.push({ empleado: col.empleado, nombre: col.nombre, perfil: 'colaborador' });
      db.colaboradores.push(Object.assign({}, col));
    });

    let evalSeq = 1, idSeq = 1;
    const nextEvalId = () => 'EVAL-2026-' + String(evalSeq++).padStart(3, '0');
    const nextId = (prefix) => prefix + '-' + String(idSeq++).padStart(4, '0');

    function crearEvaluacion(col, tipo, perfilObjetivo, estado, fechaBase, completa) {
      const evaluacionId = nextEvalId();
      const createdAt = fechaBase + 'T09:00:00';
      const evaluacion = {
        id: evaluacionId,
        periodoId,
        colaboradorId: col.empleado,
        liderId: col.liderId,
        tipo, // 'autoevaluacion' | 'lider'
        estado,
        fortalezas: '',
        comentarios: '',
        createdAt,
        updatedAt: createdAt,
        completedAt: completa ? fechaBase + 'T17:30:00' : null
      };
      db.evaluaciones.push(evaluacion);

      if (perfilObjetivo) {
        ['actitud', 'habilidades', 'conocimientos'].forEach((sec) => {
          const respuestas = D.generarRespuestas(D.COMPETENCIAS[sec], perfilObjetivo[sec], col.empleado + tipo + sec, sec === 'conocimientos');
          respuestas.forEach((r) => {
            db.respuestas.push({ evaluacionId, seccion: sec, competenciaId: r.competenciaId, valor: r.valor, comentario: r.comentario });
          });
        });
        const objetivos = D.generarObjetivos(perfilObjetivo.objetivos, col.empleado + tipo, null);
        objetivos.forEach((o, idx) => {
          db.objetivos.push({ evaluacionId, index: idx, descripcion: o.descripcion, resultado: o.resultado, calificacion: o.calificacion });
        });
      }
      return evaluacionId;
    }

    function calcularYGuardarResultado(evaluacionId, colaboradorId, origen, fecha) {
      const respPorSeccion = { actitud: [], habilidades: [], conocimientos: [] };
      db.respuestas.filter((r) => r.evaluacionId === evaluacionId).forEach((r) => respPorSeccion[r.seccion].push({ valor: r.valor }));
      const objetivos = db.objetivos.filter((o) => o.evaluacionId === evaluacionId);
      const resultado = C.calcularResultado(respPorSeccion, objetivos);
      db.resultados.push({
        id: nextId('RES'),
        evaluacionId,
        colaboradorId,
        periodoId,
        origen,
        puntajes: resultado.puntajes,
        promedios: resultado.promedios,
        nivel: resultado.nivel,
        fecha
      });
      return resultado;
    }

    // Fechas base deterministas dentro del periodo, escalonadas por colaborador
    const fechaAuto = '2026-07-05';
    const fechaLider = '2026-07-18';

    D.COLABORADORES.forEach((col, index) => {
      const estado = col.estadoDemo;
      if (estado === 'no_iniciada') return;

      if (estado === 'en_progreso') {
        const evalId = crearEvaluacion(col, 'autoevaluacion', null, D.ESTADOS.EN_PROGRESO, fechaAuto, false);
        // Solo se llenó la sección A (parcial), como haría un colaborador a medio camino.
        D.COMPETENCIAS.actitud.forEach((c) => {
          db.respuestas.push({ evaluacionId: evalId, seccion: 'actitud', competenciaId: c.id, valor: 4, comentario: '' });
        });
        return;
      }

      // A partir de aquí: autoevaluación siempre completa.
      const perfilAuto = col.perfilObjetivo || { actitud: 3.2, habilidades: 3.0, conocimientos: 3.0, objetivos: 3.0 };
      const evalAutoId = crearEvaluacion(col, 'autoevaluacion', perfilAuto, D.ESTADOS.COMPLETADA, fechaAuto, true);
      calcularYGuardarResultado(evalAutoId, col.empleado, 'autoevaluacion', fechaAuto);

      if (estado === 'pendiente_lider') return;

      const perfilLider = col.perfilObjetivoLider || perfilAuto;
      const evalLiderId = crearEvaluacion(col, 'lider', perfilLider, D.ESTADOS.COMPLETADA, fechaLider, true);
      const liderEval = db.evaluaciones.find((e) => e.id === evalLiderId);
      liderEval.fortalezas = 'Muestra disposición y compromiso con el equipo.';
      const resultadoLider = calcularYGuardarResultado(evalLiderId, col.empleado, 'lider', fechaLider);

      if (estado === 'pendiente_calibracion') return;

      // Calibración
      const resAuto = db.resultados.find((r) => r.evaluacionId === evalAutoId);
      const totalAuto = resAuto.puntajes.total;
      const totalLider = resultadoLider.puntajes.total;
      const ajuste = 0;
      const resultadoCalibrado = C.round1(totalLider + ajuste);
      const fechaCalib = '2026-08-01';
      const calibracion = {
        id: nextId('CAL'),
        colaboradorId: col.empleado,
        periodoId,
        resultadoAuto: totalAuto,
        resultadoLider: totalLider,
        diferenciaGeneral: C.round1(totalAuto - totalLider),
        ajuste,
        justificacion: 'Se ratifica el resultado de la evaluación del líder tras revisar evidencias y expediente administrativo.',
        resultadoCalibrado,
        responsable: 'Administrador RH',
        actas: index % 4 === 0 ? 1 : 0,
        nom035: index % 3 === 0 ? 'Riesgo medio — seguimiento sugerido' : 'Riesgo bajo',
        observacionesRH: 'Sin observaciones adicionales de RH para este periodo.',
        fecha: fechaCalib,
        hora: '10:00',
        retroHabilitada: false,
        aceptacionColaborador: false,
        fechaAceptacion: null,
        historial: [{
          campo: 'resultadoCalibrado',
          valorAnterior: null,
          valorNuevo: resultadoCalibrado,
          motivo: 'Calibración inicial de RH',
          usuario: 'Administrador RH',
          fecha: fechaCalib,
          hora: '10:00'
        }]
      };
      db.calibraciones.push(calibracion);
      calcularYGuardarResultado(evalLiderId, col.empleado, 'calibrado', fechaCalib);

      // Nivel inferior a 80 requiere plan de acción -> lo sembramos siempre que aplique
      const nivelBajo = resultadoCalibrado < 80;

      if (estado === 'retro_pendiente') {
        calibracion.retroHabilitada = true;
        calibracion.historial.push({ campo: 'retroHabilitada', valorAnterior: false, valorNuevo: true, motivo: 'RH habilita fase de retroalimentación', usuario: 'Administrador RH', fecha: '2026-08-03', hora: '09:00' });
        if (nivelBajo) {
          db.areas_oportunidad.push({ id: nextId('AO'), colaboradorId: col.empleado, periodoId, area: 'Cumplimiento de objetivos y estándares de calidad', planMejora: 'Reforzar seguimiento semanal con su líder y revisar prioridades.' });
          db.planes_desarrollo.push({ id: nextId('PD'), colaboradorId: col.empleado, periodoId, competencia: 'Orientación a Resultados', accion: 'Sesiones quincenales de coaching con su líder inmediato.', responsable: col.liderId, fechaCompromiso: '2026-09-15', estado: 'No iniciada', evidencia: '', observaciones: '' });
        }
        return;
      }

      if (estado === 'cerrada') {
        calibracion.retroHabilitada = true;
        calibracion.aceptacionColaborador = true;
        calibracion.fechaAceptacion = '2026-08-10';
        calibracion.historial.push({ campo: 'retroHabilitada', valorAnterior: false, valorNuevo: true, motivo: 'RH habilita fase de retroalimentación', usuario: 'Administrador RH', fecha: '2026-08-03', hora: '09:00' });
        calibracion.historial.push({ campo: 'aceptacionColaborador', valorAnterior: false, valorNuevo: true, motivo: 'Colaborador revisó y aceptó su resultado', usuario: col.nombre, fecha: '2026-08-10', hora: '11:00' });

        db.areas_oportunidad.push({ id: nextId('AO'), colaboradorId: col.empleado, periodoId, area: nivelBajo ? 'Cumplimiento de objetivos y estándares de calidad' : 'Gestión del tiempo en proyectos de alta complejidad', planMejora: nivelBajo ? 'Plan de coaching quincenal y revisión de prioridades con su líder.' : 'Adoptar herramienta de planeación semanal y revisar avances con su líder.' });
        db.planes_desarrollo.push({ id: nextId('PD'), colaboradorId: col.empleado, periodoId, competencia: nivelBajo ? 'Orientación a Resultados' : 'Desarrollo de Personas (Liderazgo)', accion: nivelBajo ? 'Sesiones de coaching quincenal con su líder inmediato.' : 'Asignar mentoría de un colaborador junior del área.', responsable: col.liderId, fechaCompromiso: '2026-09-15', estado: 'En proceso', evidencia: 'plan_desarrollo_firmado.pdf', observaciones: '' });

        // Cronograma de 6 semanas
        const accionesBase = [
          ['Sesión de retroalimentación formal', 1, 1, 'Completada', 100],
          ['Definición de compromisos de mejora', 1, 2, 'Completada', 100],
          ['Primer seguimiento de avance', 3, 3, nivelBajo ? 'En proceso' : 'Completada', nivelBajo ? 60 : 100],
          ['Segundo seguimiento de avance', 4, 4, 'En proceso', 40],
          ['Revisión intermedia con líder', 5, 5, 'No iniciada', 0],
          ['Cierre de plan y evaluación de resultados', 6, 6, 'No iniciada', 0]
        ];
        accionesBase.forEach((a) => {
          db.acciones.push({
            id: nextId('ACC'), colaboradorId: col.empleado, periodoId,
            accion: a[0], responsable: col.liderId, semanaInicio: a[1], semanaFin: a[2],
            estado: a[3], avance: a[4], evidencia: a[3] === 'Completada' ? 'evidencia_semana' + a[2] + '.pdf' : ''
          });
        });

        db.evidencias.push({ id: nextId('EVI'), colaboradorId: col.empleado, periodoId, nombreArchivo: 'retroalimentacion_firmada.pdf', tipo: 'PDF firmado', fecha: '2026-08-10', usuario: col.nombre, comentario: 'Documento de retroalimentación firmado por ambas partes.' });
      }
    });

    // Auditoría de la carga inicial
    db.auditoria.push({
      id: nextId('AUD'), usuario: 'Sistema', accion: 'Carga de datos de demostración', entidad: 'sistema', entidadId: '-',
      fecha: '2026-06-01', hora: '08:00', valorAnterior: null, valorNuevo: 'Base de datos inicial cargada'
    });

    return db;
  }

  // ===========================================================================
  // PERSISTENCIA
  // ===========================================================================
  function load() {
    if (_db) return _db;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) { _db = JSON.parse(raw); return _db; }
    } catch (e) { console.warn('EDDStorage: no se pudo leer localStorage, se reconstruye la semilla.', e); }
    _db = buildSeedDB();
    persist();
    return _db;
  }

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(_db));
    } catch (e) {
      console.error('EDDStorage: error guardando en localStorage', e);
    }
  }

  function reset() {
    localStorage.removeItem(STORAGE_KEY);
    _db = null;
    return load();
  }

  let _idCounter = 90000;
  function generarId(prefix) {
    _idCounter += 1;
    return prefix + '-' + Date.now().toString(36) + '-' + _idCounter.toString(36);
  }

  function nowParts() {
    const d = new Date();
    const fecha = d.toISOString().slice(0, 10);
    const hora = d.toTimeString().slice(0, 5);
    return { fecha, hora, iso: d.toISOString() };
  }

  // ===========================================================================
  // AUDITORÍA
  // ===========================================================================
  function addAudit(usuario, accion, entidad, entidadId, valorAnterior, valorNuevo) {
    const db = load();
    const t = nowParts();
    db.auditoria.unshift({
      id: generarId('AUD'), usuario, accion, entidad, entidadId,
      fecha: t.fecha, hora: t.hora, valorAnterior: valorAnterior === undefined ? null : valorAnterior, valorNuevo: valorNuevo === undefined ? null : valorNuevo
    });
    persist();
  }

  // ===========================================================================
  // CONSULTAS BÁSICAS
  // ===========================================================================
  function getUsuario(empleado) { return load().usuarios.find((u) => u.empleado === String(empleado)); }
  function getColaborador(empleado) { return load().colaboradores.find((c) => c.empleado === String(empleado)); }
  function getLider(empleado) { return load().lideres.find((l) => l.empleado === String(empleado)); }
  function getColaboradoresDeLider(liderId) { return load().colaboradores.filter((c) => c.liderId === String(liderId)); }
  function getTodosColaboradores() { return load().colaboradores.slice(); }
  function getTodosLideres() { return load().lideres.slice(); }
  function getTodosAdministradores() { return load().administradores.slice(); }
  function getJerarquias() { return load().jerarquias.slice(); }
  function getPeriodoActivo() { return load().periodos.find((p) => p.activo); }

  function getEvaluacion(colaboradorId, periodoId, tipo) {
    return load().evaluaciones.find((e) => e.colaboradorId === String(colaboradorId) && e.periodoId === periodoId && e.tipo === tipo);
  }

  function getOrCreateEvaluacion(colaboradorId, liderId, periodoId, tipo) {
    const db = load();
    let ev = getEvaluacion(colaboradorId, periodoId, tipo);
    if (!ev) {
      const t = nowParts();
      ev = { id: generarId('EVAL'), periodoId, colaboradorId: String(colaboradorId), liderId: String(liderId), tipo, estado: global.EDDData.ESTADOS.EN_PROGRESO, fortalezas: '', comentarios: '', createdAt: t.iso, updatedAt: t.iso, completedAt: null };
      db.evaluaciones.push(ev);
      persist();
      addAudit(colaboradorId, 'Inicio de evaluación', 'evaluaciones', ev.id, null, tipo);
    }
    return ev;
  }

  function getRespuestas(evaluacionId) { return load().respuestas.filter((r) => r.evaluacionId === evaluacionId); }
  function getRespuestasPorSeccion(evaluacionId) {
    const out = { actitud: [], habilidades: [], conocimientos: [] };
    getRespuestas(evaluacionId).forEach((r) => { if (out[r.seccion]) out[r.seccion].push(r); });
    return out;
  }

  function saveRespuesta(evaluacionId, seccion, competenciaId, valor, comentario) {
    const db = load();
    let r = db.respuestas.find((x) => x.evaluacionId === evaluacionId && x.competenciaId === competenciaId);
    if (r) { r.valor = valor; r.comentario = comentario || ''; }
    else { db.respuestas.push({ evaluacionId, seccion, competenciaId, valor, comentario: comentario || '' }); }
    const ev = db.evaluaciones.find((e) => e.id === evaluacionId);
    if (ev) { ev.updatedAt = nowParts().iso; if (ev.estado === global.EDDData.ESTADOS.NO_INICIADA) ev.estado = global.EDDData.ESTADOS.EN_PROGRESO; }
    persist();
  }

  function getObjetivos(evaluacionId) {
    return load().objetivos.filter((o) => o.evaluacionId === evaluacionId).sort((a, b) => a.index - b.index);
  }

  function saveObjetivo(evaluacionId, index, descripcion, resultado, calificacion, extra) {
    const db = load();
    let o = db.objetivos.find((x) => x.evaluacionId === evaluacionId && x.index === index);
    const extras = extra || {};
    if (o) {
      o.descripcion = descripcion;
      o.resultado = resultado;
      o.calificacion = calificacion;
      if (Object.prototype.hasOwnProperty.call(extras, 'meta')) o.meta = extras.meta || '';
      if (Object.prototype.hasOwnProperty.call(extras, 'fechaCompromiso')) o.fechaCompromiso = extras.fechaCompromiso || '';
      if (Object.prototype.hasOwnProperty.call(extras, 'alcanzable')) o.alcanzable = !!extras.alcanzable;
      if (Object.prototype.hasOwnProperty.call(extras, 'relevante')) o.relevante = !!extras.relevante;
      if (Object.prototype.hasOwnProperty.call(extras, 'cumplimiento')) o.cumplimiento = extras.cumplimiento;
      if (Object.prototype.hasOwnProperty.call(extras, 'noCuantificable')) o.noCuantificable = !!extras.noCuantificable;
    } else {
      db.objetivos.push({ evaluacionId, index, descripcion, resultado, calificacion, meta: extras.meta || '', fechaCompromiso: extras.fechaCompromiso || '', alcanzable: !!extras.alcanzable, relevante: !!extras.relevante, cumplimiento: extras.cumplimiento ?? '', noCuantificable: !!extras.noCuantificable });
    }
    persist();
  }

  function removeObjetivo(evaluacionId, index) {
    const db = load();
    db.objetivos = db.objetivos.filter((o) => !(o.evaluacionId === evaluacionId && o.index === index));
    persist();
  }

  function completarEvaluacion(evaluacionId, usuario) {
    const db = load();
    const ev = db.evaluaciones.find((e) => e.id === evaluacionId);
    if (!ev) return null;
    const t = nowParts();
    ev.estado = global.EDDData.ESTADOS.COMPLETADA;
    ev.completedAt = t.iso;
    ev.updatedAt = t.iso;

    const respPorSeccion = getRespuestasPorSeccion(evaluacionId);
    const objetivos = getObjetivos(evaluacionId);
    const resultado = global.EDDCalc.calcularResultado(respPorSeccion, objetivos);
    db.resultados.push({
      id: generarId('RES'), evaluacionId, colaboradorId: ev.colaboradorId, periodoId: ev.periodoId,
      origen: ev.tipo, puntajes: resultado.puntajes, promedios: resultado.promedios, nivel: resultado.nivel, fecha: t.fecha
    });
    persist();
    addAudit(usuario, 'Envío de evaluación', 'evaluaciones', evaluacionId, 'En progreso', 'Completada');
    return resultado;
  }

  function getResultado(evaluacionId) {
    const arr = load().resultados.filter((r) => r.evaluacionId === evaluacionId);
    return arr.length ? arr[arr.length - 1] : null;
  }
  function getUltimoResultadoPorOrigen(colaboradorId, periodoId, origen) {
    const arr = load().resultados.filter((r) => r.colaboradorId === colaboradorId && r.periodoId === periodoId && r.origen === origen);
    return arr.length ? arr[arr.length - 1] : null;
  }

  // ===========================================================================
  // ESTADO GENERAL DEL PROCESO (deriva de evaluaciones + calibración)
  // ===========================================================================
  function estadoProceso(colaboradorId, periodoId) {
    const E = global.EDDData.ESTADOS;
    const autoEval = getEvaluacion(colaboradorId, periodoId, 'autoevaluacion');
    const liderEval = getEvaluacion(colaboradorId, periodoId, 'lider');
    const calibracion = getCalibracion(colaboradorId, periodoId);

    if (!autoEval || autoEval.estado === E.NO_INICIADA) return E.NO_INICIADA;
    if (autoEval.estado === E.EN_PROGRESO) return E.EN_PROGRESO;
    // autoevaluación completada
    if (!liderEval || liderEval.estado !== E.COMPLETADA) return E.PENDIENTE_LIDER;
    if (!calibracion) return E.PENDIENTE_CALIBRACION;
    if (!calibracion.retroHabilitada) return E.CALIBRADA;
    if (!calibracion.aceptacionColaborador) return E.RETRO_PENDIENTE;
    return E.CERRADA;
  }

  function getCalibracion(colaboradorId, periodoId) {
    return load().calibraciones.find((c) => c.colaboradorId === String(colaboradorId) && c.periodoId === periodoId);
  }

  function crearOActualizarCalibracion(colaboradorId, periodoId, cambios, usuario) {
    const db = load();
    const t = nowParts();
    let cal = getCalibracion(colaboradorId, periodoId);
    const esNuevo = !cal;
    if (!cal) {
      cal = { id: generarId('CAL'), colaboradorId: String(colaboradorId), periodoId, historial: [], retroHabilitada: false, aceptacionColaborador: false, fechaAceptacion: null };
      db.calibraciones.push(cal);
    }
    Object.keys(cambios).forEach((campo) => {
      const valorAnterior = cal[campo] !== undefined ? cal[campo] : null;
      const valorNuevo = cambios[campo];
      if (JSON.stringify(valorAnterior) !== JSON.stringify(valorNuevo)) {
        cal.historial.push({ campo, valorAnterior, valorNuevo, motivo: cambios._motivo || 'Actualización de calibración', usuario, fecha: t.fecha, hora: t.hora });
        cal[campo] = valorNuevo;
      }
    });
    persist();
    addAudit(usuario, esNuevo ? 'Calibración registrada' : 'Calibración modificada', 'calibraciones', cal.id, null, JSON.stringify(cambios));

    if (cambios.resultadoCalibrado !== undefined) {
      db.resultados.push({
        id: generarId('RES'), evaluacionId: null, colaboradorId: String(colaboradorId), periodoId,
        origen: 'calibrado', puntajes: { total: cambios.resultadoCalibrado }, promedios: {}, nivel: global.EDDCalc.clasificarNivel(cambios.resultadoCalibrado), fecha: t.fecha
      });
      persist();
    }
    return cal;
  }

  function habilitarRetroalimentacion(colaboradorId, periodoId, usuario) {
    return crearOActualizarCalibracion(colaboradorId, periodoId, { retroHabilitada: true, _motivo: 'RH habilita fase de retroalimentación' }, usuario);
  }

  function aceptarResultado(colaboradorId, periodoId, usuario) {
    const t = nowParts();
    const cal = crearOActualizarCalibracion(colaboradorId, periodoId, { aceptacionColaborador: true, fechaAceptacion: t.fecha, _motivo: 'Colaborador aceptó su resultado' }, usuario);
    addAudit(usuario, 'Cierre de evaluación', 'calibraciones', cal.id, false, true);
    return cal;
  }

  // ===========================================================================
  // ÁREAS DE OPORTUNIDAD / PLAN DE DESARROLLO / ACCIONES / EVIDENCIAS
  // ===========================================================================
  function getAreasOportunidad(colaboradorId, periodoId) { return load().areas_oportunidad.filter((a) => a.colaboradorId === colaboradorId && a.periodoId === periodoId); }
  function addAreaOportunidad(colaboradorId, periodoId, area, planMejora, usuario) {
    const db = load();
    const item = { id: generarId('AO'), colaboradorId, periodoId, area, planMejora };
    db.areas_oportunidad.push(item); persist();
    addAudit(usuario, 'Registro de área de oportunidad', 'areas_oportunidad', item.id, null, area);
    return item;
  }
  function removeAreaOportunidad(id, usuario) {
    const db = load();
    db.areas_oportunidad = db.areas_oportunidad.filter((a) => a.id !== id);
    persist();
    addAudit(usuario, 'Eliminación de área de oportunidad', 'areas_oportunidad', id, null, null);
  }

  function getPlanesDesarrollo(colaboradorId, periodoId) { return load().planes_desarrollo.filter((p) => p.colaboradorId === colaboradorId && p.periodoId === periodoId); }
  function addPlanDesarrollo(colaboradorId, periodoId, data, usuario) {
    const db = load();
    const item = Object.assign({ id: generarId('PD'), colaboradorId, periodoId, estado: 'No iniciada', evidencia: '', observaciones: '' }, data);
    db.planes_desarrollo.push(item); persist();
    addAudit(usuario, 'Registro de plan de desarrollo', 'planes_desarrollo', item.id, null, data.competencia);
    return item;
  }
  function updatePlanDesarrollo(id, cambios, usuario) {
    const db = load();
    const item = db.planes_desarrollo.find((p) => p.id === id);
    if (!item) return null;
    const anterior = Object.assign({}, item);
    Object.assign(item, cambios);
    persist();
    addAudit(usuario, 'Actualización de plan de desarrollo', 'planes_desarrollo', id, anterior.estado, item.estado);
    return item;
  }
  function removePlanDesarrollo(id, usuario) {
    const db = load();
    db.planes_desarrollo = db.planes_desarrollo.filter((p) => p.id !== id);
    persist();
    addAudit(usuario, 'Eliminación de plan de desarrollo', 'planes_desarrollo', id, null, null);
  }

  function getAcciones(colaboradorId, periodoId) { return load().acciones.filter((a) => a.colaboradorId === colaboradorId && a.periodoId === periodoId).sort((a, b) => a.semanaInicio - b.semanaInicio); }
  function addAccion(colaboradorId, periodoId, data, usuario) {
    const db = load();
    const item = Object.assign({ id: generarId('ACC'), colaboradorId, periodoId, estado: 'No iniciada', avance: 0, evidencia: '' }, data);
    db.acciones.push(item); persist();
    addAudit(usuario, 'Registro de acción de cronograma', 'acciones', item.id, null, data.accion);
    return item;
  }
  function updateAccion(id, cambios, usuario) {
    const db = load();
    const item = db.acciones.find((a) => a.id === id);
    if (!item) return null;
    const estadoAnterior = item.estado;
    Object.assign(item, cambios);
    persist();
    addAudit(usuario, 'Actualización de acción de cronograma', 'acciones', id, estadoAnterior, item.estado);
    return item;
  }

  function getEvidencias(colaboradorId, periodoId) { return load().evidencias.filter((e) => e.colaboradorId === colaboradorId && e.periodoId === periodoId); }
  function addEvidencia(colaboradorId, periodoId, nombreArchivo, tipo, usuario, comentario) {
    const db = load();
    const t = nowParts();
    const item = { id: generarId('EVI'), colaboradorId, periodoId, nombreArchivo, tipo, fecha: t.fecha, usuario, comentario: comentario || '' };
    db.evidencias.push(item); persist();
    addAudit(usuario, 'Carga de evidencia', 'evidencias', item.id, null, nombreArchivo);
    return item;
  }

  // ===========================================================================
  // CONFIGURACIÓN
  // ===========================================================================
  function getConfiguracion() { return load().configuracion; }
  function updateConfigBrecha(nuevo, usuario) {
    const db = load();
    const anterior = Object.assign({}, db.configuracion.configBrecha);
    db.configuracion.configBrecha = nuevo;
    global.EDDCalc.CONFIG_BRECHA.alineadaMax = nuevo.alineadaMax;
    global.EDDCalc.CONFIG_BRECHA.revisarMax = nuevo.revisarMax;
    persist();
    addAudit(usuario, 'Configuración de umbrales de brecha modificada', 'configuracion', 'configBrecha', JSON.stringify(anterior), JSON.stringify(nuevo));
  }

  // ===========================================================================
  // EXPORTS
  // ===========================================================================
  global.EDDStorage = {
    load, persist, reset, generarId, nowParts, addAudit,
    getUsuario, getColaborador, getLider, getColaboradoresDeLider, getTodosColaboradores, getTodosLideres, getTodosAdministradores, getJerarquias, getPeriodoActivo,
    getEvaluacion, getOrCreateEvaluacion, getRespuestas, getRespuestasPorSeccion, saveRespuesta,
    getObjetivos, saveObjetivo, removeObjetivo, completarEvaluacion, getResultado, getUltimoResultadoPorOrigen,
    estadoProceso, getCalibracion, crearOActualizarCalibracion, habilitarRetroalimentacion, aceptarResultado,
    getAreasOportunidad, addAreaOportunidad, removeAreaOportunidad,
    getPlanesDesarrollo, addPlanDesarrollo, updatePlanDesarrollo, removePlanDesarrollo,
    getAcciones, addAccion, updateAccion,
    getEvidencias, addEvidencia,
    getConfiguracion, updateConfigBrecha
  };
})(window);
