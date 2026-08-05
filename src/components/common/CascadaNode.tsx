import React, { useState } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { Badge } from "./Badge";
import { SemaforoDot } from "./SemaforoDot";
import { ProgressBar } from "./ProgressBar";
import { estatusClases } from "../../utils/badges";
import { semaforoDe } from "../../utils/elementHelpers";
import { formatFecha } from "../../utils/dates";
import type { Objetivo, Actividad } from "../../types";

export interface NodoCascada {
  tipo: "objetivo" | "actividad";
  elemento: Objetivo | Actividad;
  hijos: NodoCascada[];
}

export function construirNodo(
  objetivos: Objetivo[],
  actividades: Actividad[],
  tipo: "objetivo" | "actividad",
  elemento: Objetivo | Actividad
): NodoCascada {
  let hijos: NodoCascada[] = [];
  if (tipo === "objetivo") {
    const o = elemento as Objetivo;
    if (o.nivel === 3) {
      hijos = actividades
        .filter((a) => a.objetivoId === o.id && a.parentId === null)
        .map((a) => construirNodo(objetivos, actividades, "actividad", a));
    } else {
      hijos = objetivos.filter((x) => x.parentId === o.id).map((x) => construirNodo(objetivos, actividades, "objetivo", x));
    }
  } else {
    const a = elemento as Actividad;
    hijos = actividades.filter((x) => x.parentId === a.id).map((x) => construirNodo(objetivos, actividades, "actividad", x));
  }
  return { tipo, elemento, hijos };
}

export function flattenNodo(nodo: NodoCascada): { objetivos: Objetivo[]; actividades: Actividad[] } {
  const objetivos: Objetivo[] = [];
  const actividades: Actividad[] = [];
  function recorrer(n: NodoCascada) {
    if (n.tipo === "objetivo") objetivos.push(n.elemento as Objetivo);
    else actividades.push(n.elemento as Actividad);
    n.hijos.forEach(recorrer);
  }
  nodo.hijos.forEach(recorrer);
  return { objetivos, actividades };
}

export function CascadaNode({ nodo, nivelProfundidad = 0, onSeleccionar, seleccionadoId }: { nodo: NodoCascada; nivelProfundidad?: number; onSeleccionar: (n: NodoCascada) => void; seleccionadoId?: string }) {
  const [abierto, setAbierto] = useState(nivelProfundidad < 2);
  const { getUsuario } = useApp();
  const el = nodo.elemento;
  const responsableId = nodo.tipo === "objetivo" ? (el as Objetivo).responsableId : (el as Actividad).responsableEjecutorId;
  const responsable = getUsuario(responsableId);
  const seleccionado = seleccionadoId === el.id;

  return (
    <div>
      <div
        className={`flex items-center gap-2 py-2 px-2 rounded-lg cursor-pointer hover:bg-surface ${seleccionado ? "bg-brand-light/50 ring-1 ring-brand-blue/30" : ""}`}
        style={{ marginLeft: nivelProfundidad * 18 }}
        onClick={() => onSeleccionar(nodo)}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            setAbierto((v) => !v);
          }}
          className={`shrink-0 text-slate-400 ${nodo.hijos.length === 0 ? "invisible" : ""}`}
        >
          {abierto ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        <SemaforoDot semaforo={semaforoDe(el as any)} />
        <span className="text-sm font-medium text-navy truncate max-w-[220px]">{el.nombre}</span>
        <span className="text-[11px] text-slate-400 hidden md:inline">{responsable?.nombre ?? "-"}</span>
        <span className="ml-auto flex items-center gap-2 shrink-0">
          <span className="hidden sm:block w-24">
            <ProgressBar valor={(el as any).avanceCalculado} />
          </span>
          <span className="text-xs text-slate-500 w-9 text-right">{Math.round((el as any).avanceCalculado)}%</span>
          <Badge className={estatusClases[el.estatus]}>{el.estatus}</Badge>
          <span className="text-[11px] text-slate-400 hidden lg:inline">{formatFecha(el.fechaFin)}</span>
          <span className="text-[11px] text-slate-400 hidden lg:inline">{nodo.hijos.length} hijo(s)</span>
        </span>
      </div>
      {abierto && nodo.hijos.map((h) => (
        <CascadaNode key={h.elemento.id} nodo={h} nivelProfundidad={nivelProfundidad + 1} onSeleccionar={onSeleccionar} seleccionadoId={seleccionadoId} />
      ))}
    </div>
  );
}
