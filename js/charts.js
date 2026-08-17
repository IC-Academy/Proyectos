/**
 * charts.js
 * ---------------------------------------------------------------------------
 * Visualizaciones reutilizables de la beta EDD Inter-Con:
 *   - renderRadarChart(...)        Gráfico radar comparativo (SVG puro, 0 deps)
 *   - renderNineBoxFull(...)       Matriz 9-box completa (usada por el admin)
 *   - renderNineBoxIndividual(...) Matriz 9-box individual (ficha de 1 persona)
 *   - renderCuadranteInfo(cuad)    Tarjeta de significado/acción de un cuadrante
 *
 * Estas funciones son puramente de presentación: consumen los umbrales,
 * pesos y catálogo de cuadrantes desde calculations.js (única fuente de
 * verdad) y los íconos desde icons.js. No duplican fórmulas de cálculo.
 *
 * app.js (cargado después) reutiliza estas mismas funciones tanto para la
 * vista global del administrador como para las fichas individuales de
 * colaborador/líder/calibración, de modo que la matriz global y la
 * individual siempre consumen exactamente la misma configuración.
 * ---------------------------------------------------------------------------
 */

(function (global) {
  'use strict';

  function C() { return global.EDDCalc; }
  function Icons() { return global.EDDIcons; }

  function esc(str) {
    return String(str === null || str === undefined ? '' : str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function fmt(n) { return (n === null || n === undefined || isNaN(n)) ? '—' : Number(n).toFixed(1); }
  function iniciales(nombre) {
    return String(nombre || '?').split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase();
  }

  // ===========================================================================
  // RADAR DE COMPETENCIAS
  // ===========================================================================

  /**
   * dimensiones por defecto: las 4 secciones actuales, en escala homogénea 0-5.
   * Se leen de data.js (EDDData.SECCIONES_META) para no duplicar etiquetas.
   */
  function dimensionesPorDefecto() {
    const D = global.EDDData;
    const orden = ['actitud', 'habilidades', 'objetivos'];
    return orden.map((key) => ({ key, label: D.SECCIONES_META[key].titulo.replace(/^[A-D]\.\s*/, '') }));
  }

  /**
   * renderRadarChart({ autoevaluacion, evaluacionLider, calibracion, dimensiones })
   *
   * - autoevaluacion / evaluacionLider: objetos "promedios" tal como los
   *   entrega calculations.js -> calcularResultado().promedios, es decir
   *   { actitud, habilidades, objetivos } en escala 1-5 (o
   *   null si la sección no tiene calificaciones válidas). Puede pasarse
   *   null si esa evaluación aún no existe.
   * - calibracion: opcional. Si existe, debe traer { resultadoLider,
   *   resultadoCalibrado } (puntajes totales 0-100 de la evaluación del líder
   *   y del resultado calibrado). Con esos dos números se dibuja una TERCERA
   *   serie "Calibrado" que es una PROYECCIÓN PROPORCIONAL de la forma del
   *   líder (se escala cada sección por el mismo factor = calibrado/líder),
   *   nunca respuestas inventadas por sección. Ver decisión documentada en
   *   el README (sección "Radar y resultado calibrado").
   * - dimensiones: opcional, arreglo [{key,label}]; por defecto las 3
   *   secciones oficiales Rev.4.
   */
  function renderRadarChart(opts) {
    opts = opts || {};
    const dimensiones = opts.dimensiones || dimensionesPorDefecto();
    const autoevaluacion = opts.autoevaluacion || null;
    const evaluacionLider = opts.evaluacionLider || null;
    const calibracion = opts.calibracion || null;
    const size = opts.size || 300;
    const center = size / 2;
    const maxR = size / 2 - 62;
    const n = dimensiones.length || 1;
    const angleStep = (2 * Math.PI) / n;

    function xy(valor, i) {
      const angle = -Math.PI / 2 + i * angleStep;
      const v = (valor === null || valor === undefined || isNaN(valor)) ? 0 : Math.max(0, Math.min(5, Number(valor)));
      const r = (v / 5) * maxR;
      return [center + r * Math.cos(angle), center + r * Math.sin(angle)];
    }

    // Anillos de referencia (1 a 5)
    let gridSvg = '';
    for (let ring = 1; ring <= 5; ring++) {
      const r = (ring / 5) * maxR;
      const pts = dimensiones.map((d, i) => {
        const angle = -Math.PI / 2 + i * angleStep;
        return (center + r * Math.cos(angle)).toFixed(1) + ',' + (center + r * Math.sin(angle)).toFixed(1);
      }).join(' ');
      gridSvg += `<polygon points="${pts}" fill="none" stroke="#e2e8f0" stroke-width="1"/>`;
    }
    // Etiqueta numérica del anillo (solo en el eje superior, para no saturar)
    for (let ring = 1; ring <= 5; ring++) {
      const r = (ring / 5) * maxR;
      gridSvg += `<text x="${center + 4}" y="${(center - r + 3).toFixed(1)}" font-size="8" fill="#b8c2cf">${ring}</text>`;
    }

    // Ejes + etiquetas de dimensión
    let axesSvg = '';
    dimensiones.forEach((d, i) => {
      const angle = -Math.PI / 2 + i * angleStep;
      const x2 = center + maxR * Math.cos(angle), y2 = center + maxR * Math.sin(angle);
      axesSvg += `<line x1="${center}" y1="${center}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#cbd5e0" stroke-width="1"/>`;
      const lx = center + (maxR + 30) * Math.cos(angle), ly = center + (maxR + 30) * Math.sin(angle);
      const cosA = Math.cos(angle);
      const anchor = Math.abs(cosA) < 0.25 ? 'middle' : (cosA > 0 ? 'start' : 'end');
      axesSvg += `<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" font-size="11" fill="#0b2545" font-weight="700" text-anchor="${anchor}" dominant-baseline="middle">${esc(d.label)}</text>`;
    });

    function serie(valores, color, dash) {
      if (!valores) return '';
      const pts = dimensiones.map((d, i) => xy(valores[d.key], i));
      const ptsStr = pts.map((p) => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
      const circles = pts.map((p, i) => {
        const key = dimensiones[i].key;
        const val = valores[key];
        const sinDatos = val === null || val === undefined || isNaN(val);
        const title = dimensiones[i].label + ': ' + (sinDatos ? 'sin datos (N/A)' : fmt(val));
        return `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="4" fill="${color}" stroke="#fff" stroke-width="1"><title>${esc(title)}</title></circle>`;
      }).join('');
      return `<polygon points="${ptsStr}" fill="${color}" fill-opacity="0.14" stroke="${color}" stroke-width="2"${dash ? ` stroke-dasharray="${dash}"` : ''}/>${circles}`;
    }

    // Serie calibrada: proyección proporcional de la forma del líder.
    let calibValores = null;
    let calibNota = '';
    if (calibracion && calibracion.resultadoCalibrado !== undefined && calibracion.resultadoCalibrado !== null && evaluacionLider) {
      const totalLider = calibracion.resultadoLider;
      const factor = (totalLider && totalLider > 0) ? (calibracion.resultadoCalibrado / totalLider) : 1;
      calibValores = {};
      dimensiones.forEach((d) => {
        const base = evaluacionLider[d.key];
        calibValores[d.key] = (base === null || base === undefined) ? null : Math.max(0, Math.min(5, base * factor));
      });
      calibNota = 'La serie "Calibrado" es una proyección proporcional de la forma de la evaluación del líder (factor ' + factor.toFixed(2) + '×), porque la calibración de RH ajusta el resultado global y no cada sección de forma independiente. No representa respuestas individuales nuevas.';
    }

    const svg = `<svg viewBox="0 0 ${size} ${size}" class="radar-svg" role="img" aria-label="Gráfico radar de competencias">
      ${gridSvg}${axesSvg}
      ${serie(autoevaluacion, '#3b82c4')}
      ${serie(evaluacionLider, '#e0731c')}
      ${calibValores ? serie(calibValores, '#28a745', '5,4') : ''}
    </svg>`;

    const leyenda = `<div class="radar-legend">
      <span class="radar-legend-item"><span class="radar-dot" style="background:#3b82c4"></span>Autoevaluación</span>
      <span class="radar-legend-item"><span class="radar-dot" style="background:#e0731c"></span>Evaluación del líder</span>
      ${calibValores ? '<span class="radar-legend-item"><span class="radar-dot radar-dot-dashed" style="background:#28a745"></span>Calibrado (proyección proporcional)</span>' : ''}
    </div>`;

    const tabla = `<table class="table table-compact radar-table"><thead><tr>
      <th>Sección</th><th>Autoeval.</th><th>Líder</th>${calibValores ? '<th>Calibrado*</th>' : ''}
    </tr></thead><tbody>
      ${dimensiones.map((d) => `<tr><td>${esc(d.label)}</td><td>${fmt(autoevaluacion && autoevaluacion[d.key])}</td><td>${fmt(evaluacionLider && evaluacionLider[d.key])}</td>${calibValores ? `<td>${fmt(calibValores[d.key])}</td>` : ''}</tr>`).join('')}
    </tbody></table>`;

    return `<div class="radar-wrap">
      <div class="radar-chart">${svg}</div>
      <div class="radar-side">${leyenda}${tabla}${calibNota ? `<p class="muted radar-note">*${esc(calibNota)}</p>` : ''}</div>
    </div>`;
  }

  // ===========================================================================
  // MATRIZ 9-BOX (grid 3×3 compartido por la vista global y la individual)
  // ===========================================================================

  /**
   * Construye únicamente las 9 celdas (sin ejes ni leyenda), para poder
   * reutilizarse igual en la vista global (con muchos ocupantes por celda,
   * clicable) y en la individual (un solo marcador destacado, no clicable).
   *
   * ocupantes: [{ empleado, nombre, cuadrante, destacado }]
   * onCellClickJs(numero) -> string de onclick, o null si no es clicable.
   * onMarkerClickJs(empleado) -> string de onclick para un marcador, o null.
   */
  function renderNineBoxGridCore(opts) {
    const c = C();
    const icons = Icons();
    const ocupantes = opts.ocupantes || [];
    const resaltarCuadrante = opts.resaltarCuadrante || null;
    const onCellClickJs = opts.onCellClickJs || null;
    const onMarkerClickJs = opts.onMarkerClickJs || null;

    const porCuadrante = {};
    ocupantes.forEach((o) => {
      if (!o.cuadrante) return;
      (porCuadrante[o.cuadrante] = porCuadrante[o.cuadrante] || []).push(o);
    });

    const filas = [];
    for (let fila = 3; fila >= 1; fila--) {
      const cols = [];
      for (let col = 1; col <= 3; col++) {
        const nDesempeno = col, nActitud = fila;
        const numero = (nDesempeno - 1) * 3 + nActitud;
        const info = c.CUADRANTES_INFO[numero];
        const icono = (icons && icons.SVG[numero]) || '';
        const gente = porCuadrante[numero] || [];
        const onclickAttr = onCellClickJs ? ` onclick="${onCellClickJs(numero)}"` : '';
        const clases = ['ninebox-cell'];
        if (onCellClickJs) clases.push('ninebox-cell-clickable');
        if (resaltarCuadrante === numero) clases.push('ninebox-cell-sel');
        const marcadores = gente.map((o) => {
          const markClass = 'ninebox-marker' + (o.destacado ? ' ninebox-marker-destacado' : '');
          const markClick = onMarkerClickJs ? ` onclick="event.stopPropagation();${onMarkerClickJs(o.empleado)}"` : '';
          return `<span class="${markClass}" title="${esc(o.nombre)}" style="background:${info.color}"${markClick}>${esc(iniciales(o.nombre))}</span>`;
        }).join('');
        cols.push(`<div class="${clases.join(' ')}" style="border-color:${info.color}"${onclickAttr}>
          <div class="ninebox-cell-icon">${icono}</div>
          <div class="ninebox-cell-title">${numero}. ${esc(info.nombre)}</div>
          <div class="ninebox-markers">${marcadores}</div>
        </div>`);
      }
      filas.push(`<div class="ninebox-row">${cols.join('')}</div>`);
    }
    return filas.join('');
  }

  function leyendaEjes() {
    const c = C();
    return `<div class="ninebox-legend">
      <p><strong>${esc(c.CONFIG_9BOX.ejeHorizontal)}</strong> (eje horizontal): Conocimientos y Habilidades Técnicas (30%) + Cumplimiento de Objetivos (30%), convertido a base 100 sobre el bloque Técnica Funcional (60%).</p>
      <p><strong>${esc(c.CONFIG_9BOX.ejeVertical)}</strong> (eje vertical): se obtiene de la sección "Valores y Actitud" (40%) y se convierte a base 100 multiplicando el promedio por 20.</p>
      <p class="muted">Niveles por eje: ${c.CONFIG_9BOX.etiquetasNivel.join(' · ')} · Bajo &lt;60 · Medio 60–79 · Alto 80–100.</p>
    </div>`;
  }

  /**
   * Matriz 9-box completa con ejes etiquetados, niveles alto/medio/bajo en
   * ambos ejes y leyenda explicativa. Usada por el dashboard del
   * administrador (con muchos colaboradores) y también puede reutilizarse
   * para vistas de solo lectura.
   */
  function renderNineBoxFull(opts) {
    opts = opts || {};
    const c = C();
    const niveles = c.CONFIG_9BOX.etiquetasNivel; // [Bajo, Medio, Alto]
    const gridHtml = renderNineBoxGridCore(opts);
    return `<div class="ninebox-full">
      <div class="ninebox-full-body">
        <div class="ninebox-vaxis-labels">
          <span>${esc(niveles[2])}</span><span>${esc(niveles[1])}</span><span>${esc(niveles[0])}</span>
        </div>
        <div class="ninebox-axes"><div class="axis-y">${esc(c.CONFIG_9BOX.ejeVertical)} ▲</div></div>
        <div class="ninebox-grid">${gridHtml}</div>
      </div>
      <div class="ninebox-haxis-row">
        <div class="ninebox-haxis-spacer"></div>
        <div class="ninebox-haxis-labels"><span>${esc(niveles[0])}</span><span>${esc(niveles[1])}</span><span>${esc(niveles[2])}</span></div>
      </div>
      <div class="axis-x">${esc(c.CONFIG_9BOX.ejeHorizontal)} ►</div>
      ${leyendaEjes()}
    </div>`;
  }

  /**
   * renderNineBoxIndividual({ actitudProm, desempenoProm, nombreColaborador })
   * Matriz 9-box completa (9 cuadrantes visibles) con un único marcador
   * destacado: la ubicación del colaborador de la ficha actual. Reutiliza la
   * misma configuración (CONFIG_9BOX / CUADRANTES_INFO) y el mismo grid core
   * que la matriz global, para que ambas sean siempre consistentes.
   */
  function renderNineBoxIndividual(resultado) {
    resultado = resultado || {};
    const c = C();
    const cuad = c.asignarCuadrante(resultado.actitudProm, resultado.desempenoProm);
    const ocupantes = cuad.cuadrante ? [{ empleado: 'actual', nombre: resultado.nombreColaborador || 'Colaborador', cuadrante: cuad.cuadrante, destacado: true }] : [];
    const gridHtml = renderNineBoxGridCore({ ocupantes, resaltarCuadrante: cuad.cuadrante, onCellClickJs: null, onMarkerClickJs: null });
    const niveles = c.CONFIG_9BOX.etiquetasNivel;

    const resumen = cuad.info
      ? renderCuadranteInfo(cuad)
      : '<p class="muted">No hay datos suficientes para ubicar al colaborador en la matriz (faltan calificaciones válidas).</p>';

    return `<div class="ninebox-individual">
      <div class="ninebox-full-body ninebox-full-body-sm">
        <div class="ninebox-vaxis-labels"><span>${esc(niveles[2])}</span><span>${esc(niveles[1])}</span><span>${esc(niveles[0])}</span></div>
        <div class="ninebox-axes"><div class="axis-y">${esc(c.CONFIG_9BOX.ejeVertical)} ▲</div></div>
        <div class="ninebox-grid ninebox-grid-sm">${gridHtml}</div>
      </div>
      <div class="ninebox-haxis-row">
        <div class="ninebox-haxis-spacer"></div>
        <div class="ninebox-haxis-labels"><span>${esc(niveles[0])}</span><span>${esc(niveles[1])}</span><span>${esc(niveles[2])}</span></div>
      </div>
      <div class="axis-x">${esc(c.CONFIG_9BOX.ejeHorizontal)} ►</div>
      <div class="ninebox-individual-scores">
        <span class="mini-kpi"><strong>${fmt(resultado.desempenoProm)}</strong><span>Desempeño (esc. 1-5)</span></span>
        <span class="mini-kpi"><strong>${fmt(resultado.actitudProm)}</strong><span>Actitud (esc. 1-5)</span></span>
      </div>
      ${resumen}
    </div>`;
  }

  // ===========================================================================
  // TARJETA DE SIGNIFICADO / ACCIÓN DE UN CUADRANTE (compartida)
  // ===========================================================================
  function renderCuadranteInfo(cuad) {
    const icons = Icons();
    const icono = (icons && icons.SVG[cuad.cuadrante]) || '';
    return `<div class="cuadrante-box" style="border-color:${cuad.info.color}">
      <div class="cuadrante-icon">${icono}</div>
      <div class="cuadrante-body">
        <div class="cuadrante-title-row">
          <div class="cuadrante-num" style="background:${cuad.info.color}">${cuad.cuadrante}</div>
          <strong>${esc(cuad.info.nombre)}</strong> — <span class="muted">Prioridad: ${esc(cuad.info.prioridad)}</span>
        </div>
        <p>${esc(cuad.info.significado)}</p>
        <p><strong>Acción sugerida:</strong> ${esc(cuad.info.accion)}</p>
        <p class="muted">Seguimiento: ${esc(cuad.info.seguimiento)}</p>
      </div>
    </div>`;
  }

  // ===========================================================================
  // EXPORTS
  // ===========================================================================
  global.EDDCharts = {
    renderRadarChart,
    renderNineBoxGridCore,
    renderNineBoxFull,
    renderNineBoxIndividual,
    renderCuadranteInfo,
    dimensionesPorDefecto
  };
})(window);
