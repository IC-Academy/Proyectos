import React from "react";
import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";

export function EmptyState({ titulo, mensaje, icono: Icono = Inbox }: { titulo: string; mensaje?: string; icono?: LucideIcon }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-10 px-4">
      <div className="rounded-full bg-slate-100 p-3 mb-3">
        <Icono size={22} className="text-slate-400" />
      </div>
      <p className="font-medium text-slate-600 text-sm">{titulo}</p>
      {mensaje && <p className="text-xs text-slate-400 mt-1 max-w-sm">{mensaje}</p>}
    </div>
  );
}
