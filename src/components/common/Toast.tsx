import React from "react";
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from "lucide-react";
import { useApp } from "../../context/AppContext";

const iconos = {
  success: { Icono: CheckCircle2, color: "#1F9D68" },
  error: { Icono: XCircle, color: "#D64545" },
  warning: { Icono: AlertTriangle, color: "#F4B740" },
  info: { Icono: Info, color: "#1F5A94" },
};

export function ToastContainer() {
  const { toasts, dismissToast } = useApp();
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full">
      {toasts.map((t) => {
        const { Icono, color } = iconos[t.tipo];
        return (
          <div key={t.id} className="bg-white rounded-xl shadow-soft border border-slate-100 p-3 flex items-start gap-2 animate-[fadeIn_0.2s_ease-out]">
            <Icono size={18} color={color} className="shrink-0 mt-0.5" />
            <p className="text-sm text-ink flex-1">{t.mensaje}</p>
            <button onClick={() => dismissToast(t.id)} className="text-slate-300 hover:text-slate-500">
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
