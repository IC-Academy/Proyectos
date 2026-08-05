import React from "react";
import type { LucideIcon } from "lucide-react";

interface Props {
  titulo: string;
  valor: string | number;
  icono?: LucideIcon;
  colorIcono?: string;
  subtitulo?: string;
  tendencia?: "up" | "down" | "neutral";
}

export function KpiCard({ titulo, valor, icono: Icono, colorIcono = "#1F5A94", subtitulo, tendencia }: Props) {
  return (
    <div className="bg-white rounded-xl shadow-card border border-slate-100 p-4 flex flex-col gap-2 min-w-0">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide truncate">{titulo}</span>
        {Icono && (
          <span className="rounded-lg p-1.5" style={{ backgroundColor: `${colorIcono}1A` }}>
            <Icono size={16} color={colorIcono} />
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-navy truncate">{valor}</div>
      {subtitulo && (
        <div className={`text-xs ${tendencia === "up" ? "text-success" : tendencia === "down" ? "text-danger" : "text-slate-400"}`}>{subtitulo}</div>
      )}
    </div>
  );
}
