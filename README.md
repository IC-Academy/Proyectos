<<<<<<< Updated upstream
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

## Calidad técnica: lint, build y pruebas end-to-end reproducibles

Esta sección documenta cómo verificar por cuenta propia, desde una instalación
limpia, todo lo que se afirma sobre esta entrega. No es necesario confiar en
la palabra de nadie: los tres comandos siguientes son deterministas.

```bash
rm -rf node_modules dist
npm ci               # instalación limpia — PASS
npm run build        # tsc -b && vite build — PASS
npm run lint         # oxlint — PASS, 0 errores y 0 advertencias
npm run test:e2e     # build de producción + Playwright — PASS, 14/14 pruebas
```

`npm run test:e2e` reconstruye `dist/` automáticamente (hook `pretest:e2e`) y
levanta un servidor local (`vite preview`) sirviendo esa build bajo la misma
base `/Proyectos/` que usa GitHub Pages, para probar exactamente lo que se
publica — no el entorno de desarrollo.

### Suite de pruebas (`tests/e2e/`, Playwright)

Configuración en `playwright.config.ts` (proyecto Chromium, capturas y video
en cada corrida, reporte HTML). Casos ejecutables:

- **`01-login-y-roles.spec.ts`** — login inválido; para cada uno de los 4
  roles (Administrador, Dirección, Líder, Colaborador) verifica que el menú
  mostrado corresponde exactamente a su rol, que no existe ningún control para
  cambiar de rol manualmente, y que la sesión persiste tras recargar.
- **`02-objetivo-smart.spec.ts`** — el constructor SMART bloquea la creación
  cuando las ponderaciones de área no suman 100% (la IA simulada explica el
  motivo); un objetivo SMART completo (Ventas 50% / Marketing 30% /
  Operaciones 20%) se crea correctamente y aparece calificado en el listado.
- **`03-flujo-cascada-completo.spec.ts`** — reproduce el criterio de
  aceptación íntegro en un solo recorrido: Daniela ve la actividad de Dante →
  Dante la divide en subactividades y solicita apoyo interárea a Jorge (BI) →
  Daniela aprueba como líder solicitante → Jorge aprueba como líder del área
  requerida (se crea la actividad real) → Jorge actualiza su avance → Dirección
  verifica que el dashboard, la cascada (con el panel de cuello de botella) y
  el Gantt reflejan la propagación. Cada paso adjunta una captura de pantalla
  al reporte HTML como evidencia (11 capturas numeradas).
- **`04-admin-y-resiliencia.spec.ts`** — edición de un usuario por el
  Administrador; botón "Restablecer datos de demostración"; filtro del Gantt
  por área; alta de un comentario en una actividad; y recuperación automática
  cuando el `localStorage` contiene datos corruptos (la aplicación nunca queda
  en blanco).

Para ver el reporte con las capturas de evidencia después de correr las
pruebas:

```bash
npx playwright show-report
```

> Este entorno de desarrollo ya trae Chromium preinstalado para Playwright. En
> una máquina nueva sin esa configuración, si `npm run test:e2e` falla porque
> no encuentra el navegador, ejecuta primero `npx playwright install chromium`.

### Otras verificaciones incluidas

- `dist/index.html` referencia únicamente archivos compilados dentro de
  `/Proyectos/assets/` (no contiene `<script type="module" src="/src/main.tsx">`).
- `npm run lint` (oxlint) corre sin ninguna excepción de reglas: sin hooks
  condicionales, sin dependencias faltantes en `useEffect`, sin imports sin
  usar y sin advertencias de `react/only-export-components` (los archivos que
  mezclaban componentes con helpers/contexto se separaron en
  `src/context/`, `src/utils/` y `src/components/menus.ts`).
=======
# EDD Inter-Con — Rev. 4 · Ponderación 40/30/30

Versión de frontend alineada al documento oficial `EDD_Inter-Con_Rev4_ponderacion_40_60.docx` (FOR-CAP-003 Rev. 4).

## Reglas funcionales aplicadas

- Valores y Actitud: **40%** (5 reactivos de 8%).
- Conocimientos y Habilidades Técnicas del Puesto: **30%** (5 reactivos de 6%).
- Cumplimiento de Objetivos: **30%**.
- Escala 1–5 + N/A; N/A se excluye del promedio.
- Si más de la mitad de una sección está en N/A se exige justificación en comentarios antes del envío.
- Objetivos: hasta 5 con objetivo, meta/indicador, resultado, % de cumplimiento y calificación.
- Equivalencia Rev.4: >=110%=5, 100–109%=4, 90–99%=3, 75–89%=2, <75%=1.
- Eje ACTITUD = promedio A × 20.
- Eje DESEMPEÑO = Técnica Funcional + Objetivos, convertido a base 100.
- Niveles 9-box: <60 Bajo; 60–79 Medio; 80–100 Alto.

## Importante

SMART/IA permanece en el código solo como compatibilidad futura, pero **no forma parte del flujo visible Rev.4**. El login OTP actual también se conserva sin cambios; la migración a Microsoft Entra ID/SAML se realizará en una fase separada cuando HTTPS y la configuración del IdP estén listos.

## Modo demo / API

La aplicación conserva la arquitectura existente (`APP_CONFIG.mode`). No se agregan secretos al frontend.
>>>>>>> Stashed changes
