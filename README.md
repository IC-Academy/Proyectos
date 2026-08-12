# Portal de Objetivos en Cascada

Aplicación preparada para https://ic-academy.github.io/Proyectos/

## Publicación

1. Sube todos los archivos a la raíz del repositorio Objetivos-IC.
2. En Settings > Pages conserva Source: GitHub Actions.
3. Haz commit en la rama main.
4. Revisa Actions y espera a que Publicar Portal de Objetivos termine correctamente.

No selecciones Jekyll, Static HTML ni una carpeta docs.

## Desarrollo local

Ejecuta npm install y después npm run dev.

La demo guarda cambios en el navegador. La versión productiva requerirá una base compartida y autenticación.

## Accesos locales de demostración

Todos utilizan la contraseña 1234:

- Administrador: jorge@demo.com
- Dirección: gabriel@demo.com
- Líder: daniela@demo.com
- Colaborador: dante@demo.com

El login consulta una tabla local incluida en el código. No existe conexión con backend, Airtable ni n8n. Las metas, actividades y avances se conservan únicamente en el navegador mediante localStorage.

## Flujos funcionales incluidos

- Dirección crea objetivos SMART con asistente local, selecciona áreas responsables y consulta indicadores ejecutivos por proyecto.
- Líder convierte el objetivo en actividades, distribuye trabajo a su equipo y solicita recursos de otras áreas.
- Las asignaciones interárea pasan por una bandeja local de aprobación: aceptar, rechazar o consultar comentarios.
- Colaborador desglosa su actividad asignada en acciones propias y puede solicitar apoyo especializado.
- Las solicitudes y avances se conservan localmente para demostrar la trazabilidad completa.
