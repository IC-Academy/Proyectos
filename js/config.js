/**
 * config.js
 * ---------------------------------------------------------------------------
 * Configuración central de la Plataforma EDD Inter-Con (Beta 3).
 *
 * ÚNICO lugar donde vive el modo de ejecución y los parámetros de conexión a
 * la futura API (n8n -> Airtable). Ningún otro archivo debe declarar su
 * propia URL de API ni su propia clave de sessionStorage: todos leen de
 * APP_CONFIG.
 *
 * Dos modos soportados:
 *   - "demo": no hay backend. Usa datos simulados + localStorage, exactamente
 *     igual que en beta 1/beta 2. Es el modo por defecto.
 *   - "api": el frontend queda preparado para hablar con n8n (que a su vez
 *     habla con Airtable). Los endpoints se describen en api.js. Esta beta
 *     NO implementa n8n/Airtable reales: cambiar a "api" sin una URL válida
 *     en apiBaseUrl hará que las llamadas fallen con un error de red
 *     controlado (ver api.js), que es el comportamiento esperado hasta que
 *     exista el backend real.
 *
 * Para cambiar de modo en esta demo: editar APP_CONFIG.mode más abajo, o
 * ejecutar en la consola del navegador: APP_CONFIG.mode = "api" (el cambio
 * de modo en caliente no reconstruye la sesión activa; se recomienda cerrar
 * sesión y volver a entrar después de cambiarlo).
 *
 * NUNCA colocar aquí (ni en ningún otro archivo JS del frontend):
 *   - API keys o tokens de Airtable.
 *   - Credenciales de n8n.
 *   - Contraseñas.
 * Todas las operaciones sensibles deben pasar por los webhooks de n8n, que
 * son quienes conocen las credenciales reales de Airtable (nunca el
 * navegador).
 * ---------------------------------------------------------------------------
 */

(function (global) {
  'use strict';

  const APP_CONFIG = {
    // "demo" (por defecto, sin backend) | "api" (consume webhooks de n8n)
    mode: 'demo',

    // Base de los webhooks de n8n. Sustituir por la URL real del entorno
    // cuando exista. No se usa en modo "demo".
    apiBaseUrl: 'https://URL-N8N/webhook/evaluacion',

    // Clave usada en sessionStorage para guardar la sesión (token + usuario).
    // Ver auth.js. Se usa sessionStorage y no localStorage a propósito: el
    // token no debe sobrevivir a que el usuario cierre la pestaña/navegador.
    sessionStorageKey: 'edd_session',

    // Tiempo máximo (ms) que api.js espera una respuesta antes de abortar la
    // petición y mostrar "Error de conexión".
    requestTimeout: 15000,

    // Código temporal fijo SOLO para el modo demo (ver auth.js y README,
    // sección "Modo demo vs. modo API"). En modo "api" este valor se ignora
    // por completo: la validación real la hace n8n contra el código enviado
    // por correo.
    demoCode: '123456',

    // Vigencia informativa del código temporal (minutos). La validación
    // definitiva de vigencia la debe hacer siempre el backend (n8n).
    codeValidityMinutes: 10,

    // Vigencia de la sesión/token en segundos (8 horas), usada por auth.js
    // tanto en modo demo como como valor por defecto si el backend no manda
    // "expiresIn".
    defaultSessionSeconds: 28800
  };

  global.APP_CONFIG = APP_CONFIG;
})(window);
