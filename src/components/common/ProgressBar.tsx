import React from "react";

interface Props {
  valor: number;
  color?: string;
  alto?: boolean;
  mostrarValor?: boolean;
  esperado?: number;
}

export function ProgressBar({ valor, color = "#1F5A94", alto = false, mostrarValor = false, esperado }: Props) {
  const v = Math.max(0, Math.min(100, valor));
  return (
    <div className="w-full">
      <div className={`relative w-full rounded-full bg-slate-100 overflow-hidden ${alto ? "h-3" : "h-2"}`}>
        <div className="h-full rounded-full transition-all" style={{ width: `${v}%`, backgroundColor: color }} />
        {typeof esperado === "number" && (
          <div
            className="absolute top-0 h-full border-r-2 border-navy/40"
            style={{ left: `${Math.max(0, Math.min(100, esperado))}%` }}
            title={`Avance esperado: ${Math.round(esperado)}%`}
          />
        )}
      </div>
      {mostrarValor && <div className="mt-1 text-xs text-slate-500">{Math.round(v)}%</div>}
    </div>
  );
}
