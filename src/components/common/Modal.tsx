import React from "react";
import { X } from "lucide-react";

interface Props {
  abierto: boolean;
  onClose: () => void;
  titulo: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  ancho?: "sm" | "md" | "lg" | "xl";
}

const anchos = { sm: "max-w-md", md: "max-w-xl", lg: "max-w-3xl", xl: "max-w-5xl" };

export function Modal({ abierto, onClose, titulo, children, footer, ancho = "md" }: Props) {
  if (!abierto) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-navy-dark/50 backdrop-blur-[1px]" onClick={onClose} />
      <div className={`relative w-full ${anchos[ancho]} bg-white rounded-xl shadow-soft max-h-[90vh] flex flex-col`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <h2 className="text-base font-semibold text-navy">{titulo}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 rounded-lg p-1 hover:bg-slate-50" aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5 overflow-y-auto">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-2 shrink-0">{footer}</div>}
      </div>
    </div>
  );
}
