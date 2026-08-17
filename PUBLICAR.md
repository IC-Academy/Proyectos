# Publicación — Plataforma EDD Inter-Con

Esta carpeta es un sitio estático (HTML/CSS/JS) y puede publicarse directamente en GitHub Pages, un subdominio corporativo o cualquier hosting estático.

## Publicar la demo visual

1. Subir **el contenido de esta carpeta** conservando la estructura `css/`, `js/` y `assets/`.
2. El archivo de entrada es `index.html`.
3. Actualmente `js/config.js` está en `mode: 'demo'`, por lo que usa datos locales del navegador.

## Pasar a backend real

Cuando estén disponibles los webhooks de n8n:

- cambiar `APP_CONFIG.mode` a `api` en `js/config.js`;
- sustituir `APP_CONFIG.apiBaseUrl` por la URL base real de n8n;
- no colocar tokens de Airtable, secretos de n8n ni credenciales dentro del frontend.

La autorización, OTP, roles y acceso a datos sensibles deberán validarse nuevamente del lado de n8n/backend.

## Rev.4 40/30/30
Esta entrega ya está alineada al FOR-CAP-003 Rev.4. Antes de publicar en producción, limpiar cualquier localStorage de versiones previas durante pruebas y validar el flujo completo colaborador/líder/admin.
