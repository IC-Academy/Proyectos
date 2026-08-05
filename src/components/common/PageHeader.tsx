import React from "react";
import type { Crumb } from "./Breadcrumbs";
import { Breadcrumbs } from "./Breadcrumbs";

export function PageHeader({ titulo, subtitulo, migas, acciones }: { titulo: string; subtitulo?: string; migas?: Crumb[]; acciones?: React.ReactNode }) {
  return (
    <div className="mb-5 flex items-start justify-between flex-wrap gap-3">
      <div>
        {migas && <Breadcrumbs items={migas} />}
        <h1 className="text-xl font-bold text-navy">{titulo}</h1>
        {subtitulo && <p className="text-sm text-slate-500 mt-0.5">{subtitulo}</p>}
      </div>
      {acciones && <div className="flex items-center gap-2">{acciones}</div>}
    </div>
  );
}
