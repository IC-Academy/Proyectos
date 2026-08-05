import React from "react";
import { Modal } from "./Modal";
import { HistorialTimeline } from "./HistorialTimeline";
import { EvidenciasList } from "./EvidenciasList";

export function HistorialModal({ abierto, onClose, elementoId, titulo }: { abierto: boolean; onClose: () => void; elementoId: string | null; titulo: string }) {
  if (!elementoId) return null;
  return (
    <Modal abierto={abierto} onClose={onClose} titulo={`Historial · ${titulo}`} ancho="lg">
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-xs font-semibold text-slate-500 uppercase mb-3">Línea de tiempo</h4>
          <HistorialTimeline elementoId={elementoId} />
        </div>
        <div>
          <h4 className="text-xs font-semibold text-slate-500 uppercase mb-3">Evidencias</h4>
          <EvidenciasList actividadId={elementoId} />
        </div>
      </div>
    </Modal>
  );
}
