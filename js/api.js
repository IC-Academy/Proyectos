/**
 * api.js
 * ---------------------------------------------------------------------------
 * Cliente HTTP centralizado de la Plataforma EDD Inter-Con (Beta 3).
 *
 * TODAS las peticiones al backend (n8n) deben pasar por apiRequest() /
 * las funciones EDDApi.* de este archivo. Ninguna otra pantalla debe hacer
 * fetch() directamente: así, cuando exista el backend real, solo hay que
 * ajustar este archivo (URLs, payloads, manejo de errores) sin tocar app.js.
 *
 * El frontend nunca habla con Airtable directamente; siempre pasa por los
 * webhooks de n8n descritos abajo (ver también README, sección "Arquitectura
 * objetivo" y "Endpoints previstos").
 *
 * Esta beta prepara el cliente y los endpoints, pero no requiere que n8n
 * esté funcionando: en modo "demo" estas funciones no se invocan (auth.js y
 * el resto de la app usan EDDStorage/localStorage); en modo "api", si no hay
 * backend real detrás de apiBaseUrl, las llamadas fallarán con un
 * ApiError de tipo "network", que las pantallas deben mostrar como "Error de
 * conexión" (ver sección 12 del brief).
 * ---------------------------------------------------------------------------
 */

(function (global) {
  'use strict';

  /**
   * Error de API tipado, para que las pantallas puedan decidir el mensaje
   * (nunca mostrar el detalle técnico/trazas al usuario final; eso solo va a
   * consola, ver requerimiento 12 del brief).
   *   tipo: 'network' | 'timeout' | 'unauthorized' | 'http' | 'parse'
   */
  function ApiError(tipo, mensaje, status, detalle) {
    this.name = 'ApiError';
    this.tipo = tipo;
    this.message = mensaje;
    this.status = status || null;
    this.detalle = detalle;
  }
  ApiError.prototype = Object.create(Error.prototype);

  // Evento global que auth.js escucha para cerrar sesión automáticamente
  // cuando el backend responde 401 (token inválido o expirado).
  const EVENTO_SESION_EXPIRADA = 'edd:session-expired';

  function getConfig() {
    return global.APP_CONFIG || {
      apiBaseUrl: '', sessionStorageKey: 'edd_session', requestTimeout: 15000
    };
  }

  // Lee el token directamente de sessionStorage (y no de EDDAuth) para evitar
  // una dependencia circular entre api.js y auth.js: auth.js se construye
  // ENCIMA de api.js, no al revés.
  function getStoredToken() {
    try {
      const cfg = getConfig();
      const raw = sessionStorage.getItem(cfg.sessionStorageKey);
      if (!raw) return null;
      const sess = JSON.parse(raw);
      return (sess && sess.token) ? sess.token : null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Petición centralizada a la API (n8n).
   * @param {string} endpoint - ej. '/auth/verify-code'
   * @param {object} options - { method, body, auth (bool, default true), signalExterno }
   */
  async function apiRequest(endpoint, options) {
    options = options || {};
    const cfg = getConfig();
    const method = options.method || (options.body ? 'POST' : 'GET');
    const url = (cfg.apiBaseUrl || '').replace(/\/$/, '') + endpoint;

    const headers = { 'Content-Type': 'application/json' };
    if (options.auth !== false) {
      const token = getStoredToken();
      if (token) headers['Authorization'] = 'Bearer ' + token;
    }

    const controller = (typeof AbortController !== 'undefined') ? new AbortController() : null;
    const timeoutMs = cfg.requestTimeout || 15000;
    let timeoutId = null;
    if (controller) {
      timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    }

    let response;
    try {
      response = await fetch(url, {
        method,
        headers,
        body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
        signal: controller ? controller.signal : undefined
      });
    } catch (err) {
      if (timeoutId) clearTimeout(timeoutId);
      // Nunca se le muestran trazas/errores técnicos al usuario: solo a consola.
      console.error('EDDApi: error de red llamando a', endpoint, err);
      if (err && err.name === 'AbortError') {
        throw new ApiError('timeout', 'La solicitud tardó demasiado. Intenta de nuevo.', null, err);
      }
      throw new ApiError('network', 'No fue posible conectar con el servidor. Verifica tu conexión e intenta de nuevo.', null, err);
    }
    if (timeoutId) clearTimeout(timeoutId);

    if (response.status === 401) {
      try { global.dispatchEvent(new CustomEvent(EVENTO_SESION_EXPIRADA)); } catch (e) { /* entornos sin CustomEvent */ }
      throw new ApiError('unauthorized', 'Tu sesión expiró. Inicia sesión nuevamente.', 401);
    }

    let data = null;
    const raw = await response.text();
    if (raw) {
      try { data = JSON.parse(raw); }
      catch (err) {
        console.error('EDDApi: respuesta no válida (no es JSON) de', endpoint, raw);
        throw new ApiError('parse', 'El servidor devolvió una respuesta inesperada.', response.status, raw);
      }
    }

    if (!response.ok) {
      const msg = (data && data.message) ? data.message : 'Ocurrió un error al procesar la solicitud.';
      console.error('EDDApi: respuesta de error', endpoint, response.status, data);
      throw new ApiError('http', msg, response.status, data);
    }

    return data;
  }

  // ===========================================================================
  // ENDPOINTS PREVISTOS (ver README, sección "Endpoints previstos (n8n)")
  // No es necesario que el backend ya exista para que el frontend quede
  // preparado: estas funciones solo centralizan la forma de llamarlos.
  // ===========================================================================
  const EDDApi = {
    ApiError,
    EVENTO_SESION_EXPIRADA,
    apiRequest,

    // --- Autenticación ---------------------------------------------------
    authRequestCode(numeroEmpleado) {
      return apiRequest('/auth/request-code', { method: 'POST', auth: false, body: { numeroEmpleado } });
    },
    authVerifyCode(numeroEmpleado, codigo, requestId) {
      return apiRequest('/auth/verify-code', { method: 'POST', auth: false, body: { numeroEmpleado, codigo, requestId } });
    },
    authLogout() {
      return apiRequest('/auth/logout', { method: 'POST' });
    },
    authMe() {
      return apiRequest('/auth/me', { method: 'GET' });
    },

    // --- Colaborador -------------------------------------------------------
    evaluacionesMias() { return apiRequest('/evaluaciones/mias', { method: 'GET' }); },
    evaluacionPorId(id) { return apiRequest('/evaluaciones/' + encodeURIComponent(id), { method: 'GET' }); },
    autoevaluacionGuardar(id, payload) { return apiRequest('/autoevaluacion/' + encodeURIComponent(id) + '/guardar', { method: 'POST', body: payload }); },
    autoevaluacionEnviar(id, payload) { return apiRequest('/autoevaluacion/' + encodeURIComponent(id) + '/enviar', { method: 'POST', body: payload }); },

    // --- Líder ---------------------------------------------------------------
    liderEquipo() { return apiRequest('/lider/equipo', { method: 'GET' }); },
    liderEvaluaciones() { return apiRequest('/lider/evaluaciones', { method: 'GET' }); },
    liderEvaluacionPorId(id) { return apiRequest('/lider/evaluaciones/' + encodeURIComponent(id), { method: 'GET' }); },
    liderEvaluacionGuardar(id, payload) { return apiRequest('/lider/evaluaciones/' + encodeURIComponent(id) + '/guardar', { method: 'POST', body: payload }); },
    liderEvaluacionEnviar(id, payload) { return apiRequest('/lider/evaluaciones/' + encodeURIComponent(id) + '/enviar', { method: 'POST', body: payload }); },

    // --- Administrador ---------------------------------------------------
    adminEvaluaciones() { return apiRequest('/admin/evaluaciones', { method: 'GET' }); },
    adminCalibraciones() { return apiRequest('/admin/calibraciones', { method: 'GET' }); },
    adminCalibracionGuardar(id, payload) { return apiRequest('/admin/calibraciones/' + encodeURIComponent(id) + '/guardar', { method: 'POST', body: payload }); },
    adminCalibracionLiberar(id, payload) { return apiRequest('/admin/calibraciones/' + encodeURIComponent(id) + '/liberar', { method: 'POST', body: payload }); },
    adminNineBox() { return apiRequest('/admin/nine-box', { method: 'GET' }); },

    // --- Retroalimentación -------------------------------------------------
    retroalimentacionPorId(id) { return apiRequest('/retroalimentacion/' + encodeURIComponent(id), { method: 'GET' }); },
    retroalimentacionGuardar(id, payload) { return apiRequest('/retroalimentacion/' + encodeURIComponent(id) + '/guardar', { method: 'POST', body: payload }); },
    retroalimentacionCerrar(id, payload) { return apiRequest('/retroalimentacion/' + encodeURIComponent(id) + '/cerrar', { method: 'POST', body: payload }); },

    // --- Asistente de IA para objetivos SMART -------------------------------
    // Ver README, sección "Asistente de IA para objetivos SMART". El frontend
    // nunca llama directamente a un proveedor de IA: siempre pasa por este
    // único método, que a su vez pasa por n8n (Webhook -> validar sesión ->
    // rate limit -> prompt -> LLM -> validar JSON -> responder). No hay
    // ninguna API key de proveedor de IA en este archivo ni en ningún otro
    // archivo del frontend.
    ai: {
      /**
       * @param {string} idea - Idea breve del usuario (5–500 caracteres; la
       *   validación de longitud vive en app.js, antes de llamar aquí).
       * @param {'es'|'en'} language - Idioma en el que n8n debe responder.
       * @param {{position?: string, area?: string}} [employeeContext] -
       *   Opcional. NUNCA debe incluir correo, evaluaciones, calificaciones,
       *   comentarios privados ni información de otros empleados — ver
       *   requerimiento de privacidad del brief.
       * @returns {Promise<{success: boolean, data?: object, message?: string}>}
       */
      generateSmartObjective(idea, language, employeeContext) {
        const body = { idea, language: language === 'en' ? 'en' : 'es' };
        if (employeeContext && (employeeContext.position || employeeContext.area)) {
          body.employeeContext = {};
          if (employeeContext.position) body.employeeContext.position = employeeContext.position;
          if (employeeContext.area) body.employeeContext.area = employeeContext.area;
        }
        return apiRequest('/ai/smart-objective', { method: 'POST', body });
      }
    }
  };

  global.EDDApi = EDDApi;
})(window);
