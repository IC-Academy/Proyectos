# Portal Corporativo de Objetivos en Cascada — INTER-CON

Demo funcional local (sin backend) de un portal que transforma un objetivo estratégico
de Dirección en proyectos, actividades y subactividades ejecutables, permitiendo
identificar exactamente en qué área, actividad o persona se está deteniendo el
cumplimiento de un objetivo.

> **Alcance de esta versión:** 100% local. Toda la información vive en el
> `localStorage` del navegador. No hay backend, API, ni integraciones externas
> (Airtable, n8n, Supabase, Firebase, Entra ID, EDD). Esos puntos de integración
> están modelados en el tipo de datos y documentados en la pantalla
> **Integración EDD**, pero no se conectan a nada real.

## Cascada implementada

```
Objetivo estratégico (Dirección)
  → Participación de áreas (ponderación %)
    → Proyecto / meta del líder de área
      → Actividad asignada a un colaborador
        → Subactividades del colaborador
          → (si requiere apoyo interárea) Actividad del área de apoyo, aprobada
            por el flujo de solicitudes
  → Evidencias → Avance calculado hacia arriba → Resultado consolidado
```

El avance **nunca se captura manualmente** en los niveles superiores: se calcula
siempre de abajo hacia arriba usando las ponderaciones capturadas en cada nivel
(`src/services/calc.ts`).

## Usuarios de prueba (contraseña `1234` para todos)

| Usuario | Rol | Área |
|---|---|---|
| `gabriel@demo.com` | Dirección | Dirección General |
| `daniela@demo.com` | Líder | Ventas |
| `dante@demo.com` | Colaborador | Ventas |
| `jorge@demo.com` | Administrador | Inteligencia de Negocios |
| `lucia@demo.com` | Colaborador | Ventas |
| `renata@demo.com` | Líder | Marketing |
| `ivan@demo.com` | Colaborador | Marketing |
| `marco@demo.com` | Líder | Operaciones |
| `paola@demo.com` | Colaborador | Operaciones |

El rol se determina exclusivamente por el usuario con el que se inicia sesión;
no existe selector manual de rol dentro del portal.

### Caso obligatorio precargado

El objetivo *"Aumentar 30% las ventas"* (100 → 130 ventas, octubre 2025 a
septiembre 2026, con Ventas 50% / Marketing 30% / Operaciones 20%) viene
precargado con avance parcial y realista para que los tableros, el Gantt y la
cascada se vean poblados desde el primer inicio de sesión. Incluye el caso de
uso completo descrito en los requerimientos: Daniela asigna a Dante la meta de
visitas comerciales, Dante la divide en subactividades, una de ellas
("Solicitar a Jorge Mejía apoyo para desarrollar una automatización") ya fue
aprobada y hoy es una actividad real en el portal de Jorge, cuyo avance
alimenta la subactividad de Dante, la actividad, el proyecto de Ventas y el
objetivo estratégico.

Ese ejemplo ya está aprobado para que los tableros tengan datos desde el
primer momento, pero el flujo completo (crear objetivo → asignar → dividir →
solicitar apoyo → aprobar → actualizar avance → ver la propagación) se puede
volver a ejecutar en vivo con datos nuevos, exactamente como se describe en el
criterio de aceptación.

## ¿Qué funciona de verdad? (todo, de forma local)

- **Login** con sesión persistida en `localStorage` y cierre de sesión.
- **Un solo portal**, la navegación/menú/acciones cambian según el rol.
- **Constructor SMART guiado** (5 pasos + revisión) con selección de varias
  áreas y ponderación que debe sumar 100%, y una **IA simulada** (motor de
  reglas 100% local, `src/services/smartAi.ts`) que califica 0-100, explica
  qué falta, propone una redacción y bloquea la creación si no cumple los
  mínimos.
- **Dashboard ejecutivo** con selector de objetivo, KPIs, avance real vs.
  esperado por área, área con mayor carga/más rezagada, actividades críticas,
  Gantt resumido y vista de cascada embebidos — todo cambia al cambiar el
  objetivo seleccionado.
- **Líder**: crear proyectos/metas de área, asignar actividades a su equipo,
  solicitar apoyo interárea (con el flujo de 7 pasos: área → persona sugerida →
  detalle → fechas/carga → envío de validación), ver carga de su equipo,
  aprobar/rechazar/solicitar cambios en solicitudes.
- **Colaborador**: dividir actividades en subactividades, actualizar avance,
  reportar bloqueos, adjuntar evidencia simulada, comentar, solicitar apoyo a
  otra área, ver cómo contribuye al objetivo estratégico.
- **Aprobaciones interárea** con los estatus completos del flujo (borrador,
  pendiente del líder solicitante, pendiente del líder del área requerida,
  cambios solicitados, aceptada, rechazada, cancelada) y creación real de la
  actividad al aprobarse.
- **Avance calculado hacia arriba** con ponderaciones en todos los niveles,
  advertencia visual si no suman 100%, recálculo inmediato al cambiar
  cualquier subactividad.
- **Vista de cascada** interactiva con panel lateral de detalle y **detección
  de cuello de botella explicable** (reglas locales: bloqueo, vencimiento,
  desviación, dependencia pendiente, falta de actualización, solicitud sin
  respuesta, evidencia pendiente, sobrecarga de responsable).
- **Gantt** construido con CSS puro (sin librerías pesadas), con filtros por
  objetivo/área/responsable/estado/prioridad y expandir/contraer niveles.
- **Notificaciones locales** por usuario, con generación automática de alertas
  (vencidas, por vencer, avance sin actualizar) y marcado de leídas.
- **Administración**: usuarios, áreas, periodos, aprobaciones, bitácora de
  movimientos y **botón "Restablecer demo"** que regenera los datos precargados.
- **Compatibilidad EDD**: pantalla de solo lectura que muestra cómo se
  transferirían los proyectos/actividades al ciclo de Evaluación de Desempeño,
  con los campos del modelo ya preparados (`PeriodoID`, `CicloEvaluacionID`,
  `PonderaciónEDD`, `AvanceFinal`, etc.), sin ninguna conexión externa.
- **Recuperación segura**: si el contenido de `localStorage` está corrupto, la
  aplicación nunca queda en blanco; se detecta el error y se restauran los
  datos demo automáticamente (`src/services/storage.ts` +
  `src/components/ErrorBoundary.tsx`).

## Qué permanece simulado (fuera de alcance local, por diseño)

- La carga de evidencia guarda nombre, tipo, tamaño y comentario — **no** el
  archivo real.
- No hay backend, API ni autenticación real (Entra ID). Los botones o menús
  que corresponderían a integraciones externas muestran la etiqueta
  **"Disponible en fase productiva"** en vez de simular una acción falsa.
- La Evaluación de Desempeño (EDD) se muestra como una simulación de
  transferencia de datos, sin conexión real a ningún sistema.

## Decisiones de diseño tomadas (documentadas)

Algunas decisiones menores no estaban completamente especificadas; se tomó la
opción más razonable para una demo empresarial:

1. **Jorge Mejía (Administrador, Inteligencia de Negocios)** es también el
   líder registrado de su área. Esto permite que, cuando Dante solicita su
   apoyo, la aprobación como "líder del área requerida" la resuelva Jorge
   mismo — de forma consistente con equipos pequeños de plataforma/datos que
   son punto único de contacto para su área.
2. Como Administrador también puede tener actividades propias asignadas (por
   ejemplo, resultado de una solicitud interárea aprobada), su pantalla
   **Resumen** incluye la sección **"Mis actividades asignadas"**, donde puede
   actualizar su propio avance sin salir del rol administrativo.
3. Las **subactividades** siempre se autoasignan a quien las crea (el
   colaborador dueño de la actividad); cuando una subactividad "requiere apoyo
   interárea", se crea como actividad contenedora en estatus *Pendiente de
   aprobación* y su avance queda ligado 100% a la actividad que se crea al
   aprobarse la solicitud — así el avance de la persona de apoyo se propaga
   automáticamente hacia arriba.
4. Cuando el creador de una solicitud interárea **es también el líder de su
   propia área**, el primer paso de aprobación ("líder solicitante") se omite
   automáticamente, porque ya lo es.
5. El campo "Requiere apoyo interárea" del formulario de actividad se
   implementó como una sección que se revela dentro del mismo formulario (en
   lugar de una pantalla separada) para que los 7 pasos descritos queden
   visibles y capturables en un solo lugar.

## Estructura principal del modelo de datos

Entidades independientes, con IDs propios y relaciones explícitas
(`src/types/index.ts`), todas persistidas dentro de un único objeto versionado
en `localStorage` (`icportal:v{N}:db`):

- `Usuario` (UsuarioID, EmpleadoID, rol, área, líder, personas a cargo, permisos…)
- `Area`, `Periodo`
- `Objetivo` + `ObjetivoArea` (participación y ponderación por área)
- `Proyecto` (meta de área derivada de un objetivo)
- `Actividad` — **autoreferenciada** vía `actividadPadreId`: una actividad de
  primer nivel cuelga de un `Proyecto`; sus subactividades cuelgan de ella. La
  misma entidad modela actividades y subactividades, incluye los campos EDD
  (`edd: EddCampos`) para la compatibilidad futura.
- `Dependencia`, `Evidencia`, `Comentario`
- `SolicitudInterarea` + `Aprobacion` (bandeja de aprobaciones con historial)
- `Notificacion`, `Bitacora`
- `ConfiguracionEDD`

La capa de servicio (`src/services/store.ts`) es la única que escribe: expone
métodos de creación/actualización, recalcula avances (`calc.ts`), genera
notificaciones automáticas, registra bitácora y persiste — igual que un
backend, pero en memoria + `localStorage`.

## Publicar en GitHub Pages

Repositorio de destino: `https://ic-academy.github.io/Proyectos/`

1. Sube **todo el contenido de este proyecto** (incluyendo `.github`,
   `.gitignore`, `.nojekyll`, `public`, `src`) a la raíz de la rama `main` del
   repositorio `ic-academy/Proyectos`.
2. En **Settings → Pages**, selecciona **Source: GitHub Actions**.
3. Al hacer push a `main`, el workflow `.github/workflows/deploy.yml`:
   1. Instala Node.js 20.
   2. Ejecuta `npm ci`.
   3. Ejecuta `npm run build` (genera `dist/`).
   4. Publica **exclusivamente** la carpeta `dist/` con GitHub Pages Actions.
4. `vite.config.ts` ya está configurado con `base: "/Proyectos/"`, por lo que
   el `index.html` compilado referencia los assets en `/Proyectos/assets/…` y
   no requiere ningún ajuste adicional.

No es necesario tener Node.js instalado para publicar: todo el build ocurre en
GitHub Actions. Para desarrollo local sí se requiere Node 18+:

```bash
npm ci
npm run dev       # entorno de desarrollo
npm run build     # genera dist/ igual que lo hará GitHub Actions
npm run preview   # sirve dist/ localmente para verificarlo
```

## Verificación realizada antes de esta entrega

- `npm ci` y `npm run build` (`tsc -b && vite build`) terminan sin errores.
- `dist/index.html` referencia únicamente archivos compilados dentro de
  `/Proyectos/assets/` (no contiene `<script type="module" src="/src/main.tsx">`).
- Recorrido automatizado end-to-end (Playwright) que reproduce el criterio de
  aceptación completo: login de los 4 roles, creación de objetivo SMART con
  IA simulada, creación de proyecto y actividad por Daniela, creación de
  subactividad y solicitud de apoyo por Dante, aprobación por Daniela y por
  Jorge, actualización de avance de Jorge, y verificación de que el dashboard,
  el Gantt y la cascada de Dirección reflejan la propagación del avance.
- Verificación de que la sesión y los datos persisten tras recargar, de que el
  botón "Restablecer demo" funciona, y de que corromper manualmente el
  `localStorage` no deja la aplicación en blanco.
