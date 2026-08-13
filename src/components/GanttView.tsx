import React, { useMemo, useState } from "react";
import { useApp } from "../context/useApp";
import { filasGantt, type FilaGantt } from "../services/selectors";
import { colorPorEstado } from "../utils/badges";

const COLOR_HEX: Record<string, string> = {
  green: "#1f8f4e",
  blue: "#2f7bf0",
  yellow: "#b8860b",
  red: "#c0392b",
  purple: "#6b3fa0",
  gray: "#6b7690",
  orange: "#c9660a",
};

function addMonths(d: Date, n: number): Date {
  const r = new Date(d);
  r.setMonth(r.getMonth() + n);
  return r;
}

export function GanttView({ objetivoIdFijo }: { objetivoIdFijo?: string }) {
  const { db } = useApp();
  const todasFilas = useMemo(() => filasGantt(db), [db]);

  const [objetivoId, setObjetivoId] = useState(objetivoIdFijo ?? "todos");
  const [areaId, setAreaId] = useState("todas");
  const [responsableId, setResponsableId] = useState("todos");
  const [estado, setEstado] = useState("todos");
  const [prioridad, setPrioridad] = useState("todas");
  const [colapsados, setColapsados] = useState<Set<string>>(new Set());

  const filtradas = todasFilas.filter((f) => {
    if (objetivoId !== "todos" && f.objetivoId !== objetivoId) return false;
    if (areaId !== "todas" && f.areaId !== areaId && f.tipo !== "objetivo") return false;
    if (responsableId !== "todos" && f.responsable !== responsableId && f.tipo !== "objetivo" && f.tipo !== "proyecto") return false;
    if (estado !== "todos" && f.estado !== estado) return false;
    if (prioridad !== "todas" && f.prioridad !== prioridad) return false;
    return true;
  });

  // Oculta filas cuyo ancestro visual está colapsado
  const visibles: FilaGantt[] = [];
  const ocultos = new Set<string>();
  filtradas.forEach((f) => {
    if (f.padreVisualId && (ocultos.has(f.padreVisualId) || colapsados.has(f.padreVisualId))) {
      ocultos.add(f.id);
      return;
    }
    visibles.push(f);
  });

  if (visibles.length === 0) {
    return <div className="empty-state">No hay actividades que coincidan con los filtros seleccionados.</div>;
  }

  const inicios = visibles.map((f) => new Date(f.fechaInicio).getTime());
  const fines = visibles.map((f) => new Date(f.fechaFin).getTime());
  const rangoInicio = new Date(Math.min(...inicios));
  const rangoFin = new Date(Math.max(...fines));
  rangoInicio.setDate(1);
  const totalMs = Math.max(1, rangoFin.getTime() - rangoInicio.getTime());

  const meses: Date[] = [];
  let cursor = new Date(rangoInicio);
  while (cursor <= rangoFin) {
    meses.push(new Date(cursor));
    cursor = addMonths(cursor, 1);
  }

  function pct(fechaIso: string): number {
    const t = new Date(fechaIso).getTime();
    return Math.max(0, Math.min(100, ((t - rangoInicio.getTime()) / totalMs) * 100));
  }

  const hoy = new Date();
  const hoyPct = pct(hoy.toISOString().slice(0, 10));

  const responsablesUnicos = Array.from(new Set(todasFilas.filter((f) => f.tipo === "actividad").map((f) => f.responsable)));

  return (
    <div>
      <div className="filters-row">
        {!objetivoIdFijo && (
          <select value={objetivoId} onChange={(e) => setObjetivoId(e.target.value)}>
            <option value="todos">Todos los objetivos</option>
            {db.objetivos.map((o) => (
              <option key={o.objetivoId} value={o.objetivoId}>
                {o.nombreCorto}
              </option>
            ))}
          </select>
        )}
        <select value={areaId} onChange={(e) => setAreaId(e.target.value)}>
          <option value="todas">Todas las áreas</option>
          {db.areas.map((a) => (
            <option key={a.areaId} value={a.areaId}>
              {a.nombre}
            </option>
          ))}
        </select>
        <select value={responsableId} onChange={(e) => setResponsableId(e.target.value)}>
          <option value="todos">Todos los responsables</option>
          {responsablesUnicos.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <select value={estado} onChange={(e) => setEstado(e.target.value)}>
          <option value="todos">Todos los estados</option>
          {["Completada", "En tiempo", "Por vencer", "Vencida", "Bloqueada", "Pendiente de aprobación", "Pendiente"].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select value={prioridad} onChange={(e) => setPrioridad(e.target.value)}>
          <option value="todas">Toda prioridad</option>
          {["Baja", "Media", "Alta", "Crítica"].map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      <div className="flex-gap" style={{ marginBottom: 10, flexWrap: "wrap" }}>
        {[
          ["green", "Completado"],
          ["blue", "En tiempo"],
          ["yellow", "Por vencer"],
          ["red", "Vencido"],
          ["purple", "Bloqueado"],
          ["orange", "Pendiente de aprobación"],
        ].map(([c, l]) => (
          <span key={l} className="flex-gap small-text">
            <span style={{ width: 10, height: 10, borderRadius: 3, background: COLOR_HEX[c], display: "inline-block" }} /> {l}
          </span>
        ))}
      </div>

      <div className="gantt-wrap">
        <div className="gantt-grid">
          <div className="gantt-months">
            <div className="gantt-label" style={{ fontWeight: 700 }}>
              Elemento
            </div>
            <div className="gantt-months-track" style={{ gridTemplateColumns: `repeat(${meses.length}, 1fr)` }}>
              {meses.map((m, i) => (
                <div key={i} className="gantt-month-cell">
                  {m.toLocaleDateString("es-MX", { month: "short", year: "2-digit" })}
                </div>
              ))}
            </div>
          </div>
          {visibles.map((f) => {
            const left = pct(f.fechaInicio);
            const right = pct(f.fechaFin);
            const width = Math.max(1.5, right - left);
            const color = COLOR_HEX[colorPorEstado(f.estado === "—" ? "En progreso" : f.estado)];
            const tieneHijos = todasFilas.some((h) => h.padreVisualId === f.id);
            return (
              <div className="gantt-row" key={f.id}>
                <div className="gantt-label" style={{ paddingLeft: 12 + f.nivel * 16 }}>
                  {tieneHijos ? (
                    <button
                      className="cascade-toggle"
                      style={{ border: "none", cursor: "pointer" }}
                      onClick={() =>
                        setColapsados((prev) => {
                          const next = new Set(prev);
                          if (next.has(f.id)) next.delete(f.id);
                          else next.add(f.id);
                          return next;
                        })
                      }
                    >
                      {colapsados.has(f.id) ? "+" : "−"}
                    </button>
                  ) : (
                    <span style={{ width: 20 }} />
                  )}
                  <b title={f.nombre}>{f.nombre}</b>
                </div>
                <div className="gantt-track">
                  <div style={{ position: "absolute", left: `${hoyPct}%`, top: 0, bottom: 0, width: 1, background: "var(--red-600)", opacity: 0.5 }} />
                  <div className="gantt-bar" style={{ left: `${left}%`, width: `${width}%`, background: color }} title={`${f.nombre} — ${f.avance}% — ${f.estado}`}>
                    <div className="fill" style={{ width: `${f.avance}%` }} />
                    <span style={{ position: "relative" }}>{f.avance}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
