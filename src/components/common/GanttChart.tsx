import React, { useMemo } from "react";
import { parseFecha, formatFecha, hoy } from "../../utils/dates";
import { semaforoColor } from "../../utils/semaforo";
import type { Semaforo } from "../../types";
import { EmptyState } from "./EmptyState";
import { Tooltip } from "./Tooltip";

export interface FilaGantt {
  id: string;
  nombre: string;
  nivel: number;
  fechaInicio: string;
  fechaFin: string;
  avance: number;
  estatus: string;
  responsable?: string;
  semaforo: Semaforo;
}

export function GanttChart({ filas, onSeleccionar }: { filas: FilaGantt[]; onSeleccionar?: (id: string) => void }) {
  const rango = useMemo(() => {
    if (filas.length === 0) return null;
    const inicios = filas.map((f) => parseFecha(f.fechaInicio).getTime());
    const fines = filas.map((f) => parseFecha(f.fechaFin).getTime());
    const min = Math.min(...inicios);
    const max = Math.max(...fines);
    return { min, max, total: Math.max(1, max - min) };
  }, [filas]);

  if (!rango || filas.length === 0) {
    return <EmptyState titulo="Sin elementos para mostrar en el Gantt" mensaje="Ajusta los filtros para ver actividades." />;
  }

  const hoyPct = Math.max(0, Math.min(100, ((hoy().getTime() - rango.min) / rango.total) * 100));

  // Marcadores de mes para el encabezado.
  const marcadores: { pct: number; label: string }[] = [];
  const cursor = new Date(rango.min);
  cursor.setDate(1);
  while (cursor.getTime() <= rango.max) {
    const pct = ((cursor.getTime() - rango.min) / rango.total) * 100;
    if (pct >= 0) {
      marcadores.push({ pct, label: cursor.toLocaleDateString("es-MX", { month: "short", year: "2-digit" }) });
    }
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[820px]">
        <div className="flex border-b border-slate-100 pb-2 mb-2">
          <div className="w-64 shrink-0 text-xs font-semibold text-slate-500 uppercase">Elemento</div>
          <div className="flex-1 relative h-5">
            {marcadores.map((m, i) => (
              <div key={i} className="absolute text-[10px] text-slate-400" style={{ left: `${m.pct}%` }}>
                {m.label}
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-1.5">
          {filas.map((f) => {
            const inicioPct = ((parseFecha(f.fechaInicio).getTime() - rango.min) / rango.total) * 100;
            const finPct = ((parseFecha(f.fechaFin).getTime() - rango.min) / rango.total) * 100;
            const anchoPct = Math.max(0.8, finPct - inicioPct);
            return (
              <div key={f.id} className="flex items-center">
                <div className="w-64 shrink-0 pr-3 truncate text-xs" style={{ paddingLeft: (f.nivel - 1) * 10 }}>
                  <button onClick={() => onSeleccionar?.(f.id)} className="text-navy font-medium hover:underline truncate block max-w-[230px] text-left">
                    {f.nombre}
                  </button>
                </div>
                <div className="flex-1 relative h-6 bg-slate-50 rounded">
                  <div className="absolute top-0 h-full w-px bg-navy/30" style={{ left: `${hoyPct}%` }} />
                  <Tooltip texto={`${formatFecha(f.fechaInicio)} → ${formatFecha(f.fechaFin)} · ${f.avance}% · ${f.estatus}${f.responsable ? " · " + f.responsable : ""}`}>
                    <div
                      className="absolute top-0.5 h-5 rounded-md flex items-center overflow-hidden cursor-pointer"
                      style={{ left: `${Math.max(0, inicioPct)}%`, width: `${anchoPct}%`, backgroundColor: `${semaforoColor[f.semaforo]}33`, border: `1px solid ${semaforoColor[f.semaforo]}` }}
                      onClick={() => onSeleccionar?.(f.id)}
                    >
                      <div className="h-full rounded-l-md" style={{ width: `${f.avance}%`, backgroundColor: semaforoColor[f.semaforo] }} />
                    </div>
                  </Tooltip>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
