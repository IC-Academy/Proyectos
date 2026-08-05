import React from "react";

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: "primario" | "secundario" | "peligro" | "exito" | "fantasma";
  tamano?: "sm" | "md";
}

const estilos: Record<NonNullable<Props["variante"]>, string> = {
  primario: "bg-navy text-white hover:bg-navy-dark",
  secundario: "bg-white text-navy border border-slate-200 hover:bg-slate-50",
  peligro: "bg-danger text-white hover:bg-red-700",
  exito: "bg-success text-white hover:bg-emerald-700",
  fantasma: "bg-transparent text-navy hover:bg-slate-100",
};

export function Button({ variante = "primario", tamano = "md", className, children, ...rest }: Props) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
        tamano === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm"
      } ${estilos[variante]} ${className ?? ""}`}
      {...rest}
    >
      {children}
    </button>
  );
}
