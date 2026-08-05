import React from "react";
import { useApp } from "../../context/AppContext";
import { EmptyState } from "./EmptyState";
import { formatFechaHora } from "../../utils/dates";
import { History } from "lucide-react";

export function HistorialTimeline({ elementoId }: { elementoId: string }) {
  const { historial, getUsuario } = useApp();
  const eventos = historial.filter((h) => h.elementoId === elementoId).sort((a, b) => (a.fecha < b.fecha ? 1 : -1));

  if (eventos.length === 0) {
    return <EmptyState titulo="Sin eventos registrados" mensaje="Este elemento aún no tiene historial de cambios." />;
  }

  return (
    <ol className="relative border-l border-slate-200 ml-2">
      {eventos.map((ev) => (
        <li key={ev.id} className="mb-5 ml-4">
          <span className="absolute -left-[7px] mt-1.5 h-3 w-3 rounded-full bg-brand-blue border-2 border-white" />
          <p className="text-xs text-slate-400">{formatFechaHora(ev.fecha)}</p>
          <p className="text-sm font-medium text-navy">
            {ev.accion} · <span className="font-normal text-slate-500">{getUsuario(ev.usuarioId)?.nombre ?? ev.usuarioId}</span>
          </p>
          {(ev.valorAnterior || ev.valorNuevo) && (
            <p className="text-xs text-slate-500">
              {ev.valorAnterior && <span className="line-through text-slate-400 mr-1">{ev.valorAnterior}</span>}
              {ev.valorNuevo && <span className="text-navy font-medium">{ev.valorNuevo}</span>}
            </p>
          )}
          {ev.comentario && <p className="text-xs text-slate-500 mt-0.5">{ev.comentario}</p>}
        </li>
      ))}
    </ol>
  );
}

export { History as HistorialIcon };
