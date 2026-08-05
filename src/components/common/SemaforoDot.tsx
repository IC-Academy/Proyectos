import React from "react";
import type { Semaforo } from "../../types";
import { semaforoColor, semaforoLabel } from "../../utils/semaforo";

export function SemaforoDot({ semaforo, conEtiqueta = false }: { semaforo: Semaforo; conEtiqueta?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5" title={semaforoLabel[semaforo]}>
      <span className="inline-block h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: semaforoColor[semaforo] }} />
      {conEtiqueta && <span className="text-xs text-slate-500">{semaforoLabel[semaforo]}</span>}
    </span>
  );
}
