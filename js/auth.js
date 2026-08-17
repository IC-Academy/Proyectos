/**
 * auth.js
 * ---------------------------------------------------------------------------
 * Autenticación y sesión de la Plataforma EDD Inter-Con (Beta 3).
 *
 * Sustituye el login simulado de beta 1/2 (empleado + perfil elegido a mano)
 * por un flujo de dos pasos: número de empleado -> código temporal de un
 * solo uso enviado "al correo" (simulado en modo demo, real vía n8n en modo
 * API). Ver README, sección "Login (dos pasos)".
 *
 * Responsabilidades de este módulo (únicas, no se duplican en app.js):
 *   - Solicitar código (requestCode) / validar código (verifyCode).
 *   - Guardar y leer la sesión (token + usuario) en sessionStorage, bajo la
 *     clave APP_CONFIG.sessionStorageKey.
 *   - Expiración de sesión (por tiempo, o por 401 del backend en modo API).
 *   - Cierre de sesión.
 *   - Adaptar el usuario "con forma de API" (numeroEmpleado/nombreCompleto/
 *     rol) a la forma interna que ya usa app.js desde beta 1
 *     (empleado/nombre/perfil), para no tener que reescribir el resto de la
 *     aplicación.
 *
 * Estructura de sesión guardada (igual en demo y en api, ver brief sección 5):
 *   {
 *     token: "TOKEN_TEMPORAL",
 *     expiresAt: "2026-08-06T20:00:00.000Z",
 *     user: { numeroEmpleado, nombreCompleto, rol }
 *   }
 * NO se guarda contraseña ni código temporal en ningún lado.
 * ---------------------------------------------------------------------------
 */

(function (global) {
  'use strict';

  const ROL_INTERNO_A_API = { colaborador: 'Colaborador', lider: 'Líder', administrador: 'Administrador' };
  const ROL_API_A_INTERNO = { 'colaborador': 'colaborador', 'líder': 'lider', 'lider': 'lider', 'administrador': 'administrador' };

  function cfg() { return global.APP_CONFIG; }

  // Estado efímero (solo vive mientras el usuario está en la pantalla B de
  // login, entre "solicitar código" y "validar código"). No se persiste.
  let pendiente = null; // { numeroEmpleado, requestId, maskedEmail, expiresAt }

  function maskEmail(correo) {
    if (!correo || correo.indexOf('@') === -1) return '***@***';
    const [usuario, dominio] = correo.split('@');
    const visible = usuario.slice(0, 1);
    return visible + '***@' + dominio;
  }

  function generarTokenDemo() {
    return 'DEMO-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
  }
  function generarRequestId() {
    return 'REQ-' + Math.floor(100000 + Math.random() * 900000);
  }

  function esperar(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }

  // ===========================================================================
  // PASO 1: SOLICITAR CÓDIGO
  // ===========================================================================
  async function requestCode(numeroEmpleado) {
    numeroEmpleado = String(numeroEmpleado || '').trim();
    if (!/^\d{4,10}$/.test(numeroEmpleado)) {
      throw new global.EDDApi.ApiError('validation', 'Captura un número de empleado válido.');
    }

    if (cfg().mode === 'api') {
      const resp = await global.EDDApi.authRequestCode(numeroEmpleado);
      pendiente = {
        numeroEmpleado,
        requestId: resp.requestId,
        maskedEmail: resp.maskedEmail || null,
        expiresAt: Date.now() + cfg().codeValidityMinutes * 60000
      };
      return resp;
    }

    // --- Modo demo: no hay backend. Simulamos latencia de red y armamos una
    // respuesta neutra, sin revelar si el número de empleado existe (mismo
    // comportamiento que tendría n8n en producción). El correo enmascarado
    // solo se muestra si el usuario existe en la semilla de demo.
    await esperar(500);
    const u = global.EDDStorage.getUsuario(numeroEmpleado);
    const correoDemo = u ? correoDeUsuarioDemo(numeroEmpleado) : null;
    const requestId = generarRequestId();
    pendiente = {
      numeroEmpleado,
      requestId,
      maskedEmail: correoDemo ? maskEmail(correoDemo) : null,
      expiresAt: Date.now() + cfg().codeValidityMinutes * 60000
    };
    return {
      success: true,
      message: 'Si el número de empleado se encuentra registrado, recibirás un código temporal en el correo asociado.',
      maskedEmail: pendiente.maskedEmail,
      requestId
    };
  }

  function correoDeUsuarioDemo(numeroEmpleado) {
    const col = global.EDDStorage.getColaborador(numeroEmpleado);
    if (col && col.correoCorporativo) return col.correoCorporativo;
    const lider = global.EDDStorage.getLider(numeroEmpleado);
    if (lider && lider.correoCorporativo) return lider.correoCorporativo;
    const admin = global.EDDData.ADMINISTRADORES.find((a) => a.empleado === String(numeroEmpleado));
    if (admin && admin.correoCorporativo) return admin.correoCorporativo;
    return null;
  }

  // ===========================================================================
  // PASO 2: VALIDAR CÓDIGO
  // ===========================================================================
  async function verifyCode(numeroEmpleado, codigo) {
    numeroEmpleado = String(numeroEmpleado || '').trim();
    codigo = String(codigo || '').trim();
    if (!/^\d{6}$/.test(codigo)) {
      throw new global.EDDApi.ApiError('validation', 'El código debe tener 6 dígitos.');
    }
    if (!pendiente || pendiente.numeroEmpleado !== numeroEmpleado) {
      throw new global.EDDApi.ApiError('validation', 'Primero solicita un código para este número de empleado.');
    }
    if (Date.now() > pendiente.expiresAt) {
      throw new global.EDDApi.ApiError('expired', 'El código venció. Solicita uno nuevo.');
    }

    if (cfg().mode === 'api') {
      const resp = await global.EDDApi.authVerifyCode(numeroEmpleado, codigo, pendiente.requestId);
      guardarSesionDesdeApi(resp);
      pendiente = null;
      return resp;
    }

    // --- Modo demo: único código válido es APP_CONFIG.demoCode. Nunca se
    // acepta un código fijo en modo "api" (esa rama ni siquiera llega aquí).
    if (codigo !== cfg().demoCode) {
      throw new global.EDDApi.ApiError('invalid_code', 'El código capturado no es válido.');
    }
    const u = global.EDDStorage.getUsuario(numeroEmpleado);
    if (!u) {
      throw new global.EDDApi.ApiError('invalid_code', 'El código capturado no es válido.');
    }
    const detalle = detalleUsuarioDemo(u);
    const expiresIn = cfg().defaultSessionSeconds;
    const session = {
      token: generarTokenDemo(),
      expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
      user: {
        numeroEmpleado: u.empleado,
        nombreCompleto: u.nombre,
        rol: ROL_INTERNO_A_API[u.perfil] || u.perfil,
        puesto: detalle.puesto,
        area: detalle.area
      }
    };
    guardarSesion(session);
    pendiente = null;
    return { success: true, token: session.token, expiresIn, user: session.user };
  }

  function detalleUsuarioDemo(u) {
    if (u.perfil === 'colaborador') { const c = global.EDDStorage.getColaborador(u.empleado); return { puesto: c ? c.puesto : '', area: c ? c.area : '' }; }
    if (u.perfil === 'lider') { const l = global.EDDStorage.getLider(u.empleado); return { puesto: l ? l.puesto : '', area: l ? l.area : '' }; }
    const a = global.EDDData.ADMINISTRADORES.find((x) => x.empleado === u.empleado);
    return { puesto: a ? a.puesto : '', area: a ? a.area : '' };
  }

  function guardarSesionDesdeApi(resp) {
    const expiresIn = resp.expiresIn || cfg().defaultSessionSeconds;
    guardarSesion({
      token: resp.token,
      expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
      user: resp.user
    });
  }

  // ===========================================================================
  // SESIÓN (sessionStorage — no localStorage: no debe sobrevivir el cierre
  // del navegador)
  // ===========================================================================
  function guardarSesion(session) {
    try { sessionStorage.setItem(cfg().sessionStorageKey, JSON.stringify(session)); } catch (e) { console.error('EDDAuth: no se pudo guardar la sesión', e); }
  }

  function getSession() {
    let raw;
    try { raw = sessionStorage.getItem(cfg().sessionStorageKey); } catch (e) { return null; }
    if (!raw) return null;
    let session;
    try { session = JSON.parse(raw); } catch (e) { clearSession(); return null; }
    if (!session || !session.token || !session.expiresAt) { clearSession(); return null; }
    if (Date.now() > new Date(session.expiresAt).getTime()) {
      clearSession();
      return null;
    }
    return session;
  }

  function clearSession() {
    try { sessionStorage.removeItem(cfg().sessionStorageKey); } catch (e) { /* noop */ }
  }

  // Convierte la sesión (forma "de API") a la forma interna que usa app.js
  // desde beta 1: { empleado, nombre, perfil }.
  function getAppUser(session) {
    session = session || getSession();
    if (!session) return null;
    const rolNormalizado = String(session.user.rol || '').toLowerCase();
    return {
      empleado: session.user.numeroEmpleado,
      nombre: session.user.nombreCompleto,
      perfil: ROL_API_A_INTERNO[rolNormalizado] || rolNormalizado
    };
  }

  function getToken() {
    const s = getSession();
    return s ? s.token : null;
  }

  async function logout() {
    const session = getSession();
    clearSession();
    pendiente = null;
    if (cfg().mode === 'api' && session) {
      // Best-effort: si el backend no responde, igual cerramos la sesión local.
      try { await global.EDDApi.authLogout(); } catch (e) { console.warn('EDDAuth: logout remoto falló, se cierra la sesión local de todas formas.', e); }
    }
  }

  function pendienteActual() { return pendiente; }
  function limpiarPendiente() { pendiente = null; }

  // Si el backend devuelve 401 en cualquier momento (token vencido/ inválido),
  // api.js emite este evento; cerramos la sesión local para forzar login.
  global.addEventListener(global.EDDApi ? global.EDDApi.EVENTO_SESION_EXPIRADA : 'edd:session-expired', () => {
    clearSession();
  });

  global.EDDAuth = {
    requestCode, verifyCode, getSession, clearSession, getAppUser, getToken, logout,
    maskEmail, pendienteActual, limpiarPendiente,
    ROL_INTERNO_A_API
  };
})(window);
