# Portal de Objetivos Estratégicos — Beta funcional

Beta funcional y navegable de un portal corporativo de gestión de objetivos en cascada
(Director → Líderes → Colaboradores → Integrantes del equipo), construida para validar el
flujo operativo con Dirección **antes** de desarrollar el backend definitivo en Microsoft
Dataverse, Power Apps y Power Automate.

No es un mockup: es una aplicación React funcional, con datos simulados realistas,
navegación real, formularios con validación, cambios de estado, cálculo recursivo de avance
y persistencia en LocalStorage.

## Instalación y ejecución

Requisitos: Node.js 18+ y npm.

```bash
npm install
npm run dev        # http://localhost:5173 — modo desarrollo
npm run build       # genera la build de producción en /dist
npm run preview     # sirve la build de producción localmente
```

No se requiere backend, base de datos ni servicios externos. Todo el estado se persiste en
el `localStorage` del navegador.

## Perfiles de demostración

En la pantalla de inicio (o desde el menú del encabezado) puedes alternar entre 5 perfiles,
sin contraseña real. Ver detalle en [`PERFILES_DEMO.md`](./PERFILES_DEMO.md).

| Perfil | Rol | Qué puedes ver/hacer |
|---|---|---|
| Director (Elena Marín) | Director | Panel ejecutivo, crear objetivos estratégicos, aprobar cambios de alcance/fecha a nivel objetivo, ver todo. |
| Líder de Operaciones (Jorge Alvarado) | Líder | Objetivos asignados, iniciativas/actividades, aprobaciones de su equipo, Mi equipo. |
| Líder de Recursos Humanos (Karla Solís) | Líder | Igual que el anterior, alcance RH. |
| Colaborador (Ana Torres) | Colaborador | Mis compromisos: actualizar avance, evidencias, bloqueos, delegar, solicitar cambio de fecha. |
| Colaborador delegado (Luis Ramírez) | Colaborador | Ya tiene una actividad delegada activa ("Publicar dashboard") para mostrar el flujo de delegación aprobada. |

## Arquitectura

```
src/
  types/        Modelo de datos completo (interfaces TypeScript)
  data/         Datos semilla (usuarios, objetivos, actividades, actualizaciones,
                delegaciones, bloqueos, evidencias, solicitudes de cambio)
  services/     Capa de persistencia. Un servicio CRUD por entidad
                (getAll/getById/create/update/delete/approve/reject) respaldado
                por LocalStorage — mismo contrato que tendría una API real.
  utils/        Lógica pura: cálculo recursivo de cascada, semáforo, fechas,
                motor de alertas, helpers de formato y badges.
  context/      AppContext: estado global, sesión del perfil demo activo y
                todas las acciones de negocio (crear, actualizar, aprobar,
                delegar, bloquear, etc.), con recálculo automático de la
                cascada tras cada cambio.
  hooks/        useAuth (rol activo) y wrappers de conveniencia.
  components/
    layout/     Sidebar, Header, Layout, guardas de ruta y de rol.
    common/     Librería de componentes reutilizables (KPI, tabla, modal,
                badges, semáforo, Gantt, árbol de cascada, historial, toasts...).
    forms/      Formularios/modales de creación y flujos (avance, delegación,
                bloqueo, cambio de fecha, evidencia, crear objetivo/actividad).
  pages/        Una página por vista de negocio.
```

### Por qué esta arquitectura facilita migrar a Dataverse

Cada servicio en `src/services/*Service.ts` expone `getAll / getById / create / update /
delete` (y variantes `approve/reject` donde aplica) sin exponer cómo se guardan los datos.
Hoy leen/escriben en LocalStorage (`src/services/storage.ts`); para conectar Dataverse solo
hace falta reemplazar la implementación interna de esos métodos por llamadas a la
Dataverse Web API o a flujos de Power Automate — **ningún componente ni página necesita
cambiar**, ya que todos consumen los datos a través de `AppContext`, no directamente de
`localStorage`.

### Cálculo del avance (regla de negocio central)

`src/utils/cascade.ts` implementa `recalcularCascada()`: recorre recursivamente desde las
subactividades hasta el objetivo estratégico. El avance de un elemento sin hijos es su
`avanceValidado`; el de un elemento con hijos es la suma ponderada
`Σ(avanceCalculado(hijo) × peso(hijo)) / 100`. Nunca se captura manualmente un avance de
nivel superior. La función también detecta y reporta cuando los pesos de un conjunto de
hermanos no suman 100%, para alimentar la advertencia visual y la alerta correspondiente.

`src/utils/semaforo.ts` calcula el semáforo comparando avance real vs. avance esperado
(según fechas), y `src/utils/alertsEngine.ts` genera en vivo todas las alertas del sistema
(vencidos, próximos a vencer, bloqueos críticos, avances y delegaciones pendientes, pesos
incorrectos, desviaciones críticas, solicitudes de cambio) a partir del estado actual — no
son datos "fijos" en la semilla.

## Funcionalidades terminadas (funcionan de extremo a extremo)

- Login simulado con selector de 5 perfiles y cambio de perfil desde el encabezado.
- Navegación lateral dinámica por rol, con secciones ocultas según el perfil activo.
- Panel ejecutivo del Director: KPIs, 6 gráficos (Recharts), tabla ejecutiva con 5 filtros.
- Panel del Líder: objetivos asignados, carga de trabajo, delegaciones y avances pendientes,
  actividades próximas a vencer, acceso a "Mi equipo".
- Mi equipo: tarjetas de seguimiento operativo por colaborador (no es evaluación de desempeño).
- Mis compromisos (Colaborador): KPIs, vista de tarjetas y de tabla, con acciones reales.
- Actualizar avance → queda "Pendiente de validación" → aparece en Aprobaciones del líder →
  aprobar/rechazar recalcula toda la cascada automáticamente y notifica con un toast.
- Delegar actividad (solo a integrantes del mismo equipo) → aprobación del líder → cambia el
  responsable ejecutor y aparece en "delegadas por mí / a mí".
- Reportar bloqueo, adjuntar evidencia (simulada) y solicitar cambio de fecha/alcance/peso,
  con flujo de aprobación para las solicitudes de cambio.
- Creación en vivo de objetivos estratégicos (Director), objetivos de área/iniciativas y
  actividades/subactividades (Líder), con validaciones (fechas, pesos 0–100,
  responsable/nombre obligatorios) y advertencia de pesos que no suman 100%.
- Vista jerárquica tipo árbol (expandir/colapsar) con panel de detalle lateral.
- Vista Gantt (construida con CSS Grid, sin librerías de pago) filtrable por área,
  responsable, nivel, estatus y prioridad.
- Detalle de objetivo con 7 pestañas: Resumen, Cascada, Actividades, Gantt, Evidencias,
  Riesgos e Historial.
- Centro de alertas calculado en vivo, con filtros y marcado de leído/no leído.
- Historial/trazabilidad por elemento (línea de tiempo) para creación, actualización,
  validación, rechazo, delegación, evidencia y bloqueo.
- Restablecer datos de demostración desde Configuración, con confirmación y notificación.
- Estados vacíos, tooltips, confirmaciones, notificaciones toast, validaciones de formulario,
  búsqueda y ordenamiento en tablas, breadcrumbs y diseño responsivo.

## Funcionalidades simuladas o simplificadas (deliberadamente, para esta beta)

- Las "evidencias" y su "tamaño" son metadatos simulados: no se sube ningún archivo real.
- Exportar a Excel/PDF desde Reportes muestra un aviso explícito ("función demostrativa en
  esta beta") en vez de generar un archivo, tal como pide el punto 28 de la especificación.
- El botón "Agregar comentario" está unificado dentro del modal de "Actualizar avance" (que
  ya exige comentario obligatorio), en vez de ser un botón independiente, para no duplicar
  el mismo flujo de negocio.
- Las solicitudes de "Cambio de alcance" y "Cambio de peso" registran y resuelven la
  solicitud con trazabilidad completa, pero no reescriben automáticamente campos numéricos
  complejos del objetivo (sí lo hace "Cambio de fecha"); en la versión Dataverse esto se
  ligaría a un flujo de Power Automate con lógica específica por tipo de cambio.
- El envío de notificaciones a otros usuarios se simula con un toast al usuario activo (no
  hay correo/push real), ya que la beta es de un solo usuario a la vez por diseño.

## Puntos de integración futura con Dataverse

1. Sustituir `src/services/storage.ts` por un cliente de la Dataverse Web API (o un SDK de
   Power Platform), manteniendo la misma forma de `createCrudService` en
   `src/services/createCrudService.ts`.
2. Mapear cada interfaz de `src/types/index.ts` a una tabla de Dataverse (Usuario,
   Objetivo, Actividad, Actualizacion, Delegacion, Evidencia, Bloqueo, SolicitudCambio,
   HistorialEvento).
3. Mover la lógica de aprobación/recalculo de `src/context/AppContext.tsx` a flujos de
   Power Automate disparados por cambios de columna (p. ej. al aprobar una actualización),
   manteniendo `src/utils/cascade.ts` como referencia de la fórmula de negocio.
4. Sustituir la autenticación simulada por Azure AD / Entra ID y control de acceso por
   columnas/seguridad a nivel de fila en Dataverse en lugar del filtrado en cliente.
5. Reemplazar el guardado de evidencia simulada por columnas de archivo o integración con
   SharePoint/Dataverse file columns.
6. Publicar el panel ejecutivo también como reporte de Power BI conectado directamente a
   Dataverse, reutilizando las mismas métricas ya definidas en `utils/cascade.ts` y
   `utils/semaforo.ts`.

## Restricciones respetadas

Sin backend, sin Firebase/Supabase, sin servicios de pago, sin base de datos, sin borrar
datos demo al recargar (persisten en LocalStorage), sin mostrar información fuera del
alcance simulado de cada rol, sin botones decorativos sin funcionalidad, y con el avance
consolidado siempre derivado del cálculo recursivo (nunca capturado a mano).
