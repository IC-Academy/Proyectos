import React from "react";
import { FileText, FileSpreadsheet, FileImage, Link2, File } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { EmptyState } from "./EmptyState";
import { Badge } from "./Badge";
import { validacionClases } from "../../utils/badges";
import { formatFecha } from "../../utils/dates";
import type { TipoEvidencia } from "../../types";

const iconoPorTipo: Record<TipoEvidencia, typeof FileText> = {
  PDF: FileText,
  Excel: FileSpreadsheet,
  Word: FileText,
  Imagen: FileImage,
  Enlace: Link2,
};

export function EvidenciasList({ actividadId }: { actividadId: string }) {
  const { evidencias, getUsuario } = useApp();
  const propias = evidencias.filter((e) => e.actividadId === actividadId);

  if (propias.length === 0) {
    return <EmptyState titulo="Sin evidencias adjuntas" icono={File} />;
  }

  return (
    <ul className="divide-y divide-slate-100">
      {propias.map((ev) => {
        const Icono = iconoPorTipo[ev.tipoArchivo] ?? File;
        return (
          <li key={ev.id} className="py-3 flex items-start gap-3">
            <span className="rounded-lg bg-brand-light p-2 text-brand-blue shrink-0">
              <Icono size={16} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-navy truncate">{ev.nombreArchivo}</p>
              <p className="text-xs text-slate-400">
                {ev.tipoArchivo} · {ev.tamanoSimulado} · {getUsuario(ev.usuarioId)?.nombre} · {formatFecha(ev.fecha)}
              </p>
              {ev.comentario && <p className="text-xs text-slate-500 mt-0.5">{ev.comentario}</p>}
            </div>
            <Badge className={validacionClases[ev.estatusValidacion]}>{ev.estatusValidacion}</Badge>
          </li>
        );
      })}
    </ul>
  );
}
