import React, { useState } from "react";
import { Modal } from "../common/Modal";
import { Button } from "../common/Button";
import { Field, TextArea, Select, TextInput } from "../common/Field";
import { useApp } from "../../context/AppContext";
import type { Actividad, TipoEvidencia } from "../../types";

interface Props {
  abierto: boolean;
  onClose: () => void;
  actividad: Actividad | null;
}

const TIPOS: TipoEvidencia[] = ["PDF", "Excel", "Word", "Imagen", "Enlace"];

export function EvidenciaModal({ abierto, onClose, actividad }: Props) {
  const { agregarEvidencia, usuarioActual } = useApp();
  const [nombreArchivo, setNombreArchivo] = useState("");
  const [tipoArchivo, setTipoArchivo] = useState<TipoEvidencia>("PDF");
  const [comentario, setComentario] = useState("");
  const [error, setError] = useState("");

  React.useEffect(() => {
    setNombreArchivo("");
    setTipoArchivo("PDF");
    setComentario("");
    setError("");
  }, [actividad, abierto]);

  if (!actividad || !usuarioActual) return null;

  function enviar() {
    if (!nombreArchivo.trim()) {
      setError("Indica el nombre del archivo o enlace de la evidencia.");
      return;
    }
    agregarEvidencia({ actividadId: actividad!.id, nombreArchivo: nombreArchivo.trim(), tipoArchivo, usuarioId: usuarioActual!.id, comentario: comentario.trim() || undefined });
    onClose();
  }

  return (
    <Modal
      abierto={abierto}
      onClose={onClose}
      titulo="Adjuntar evidencia"
      footer={
        <>
          <Button variante="secundario" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={enviar}>Adjuntar</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <p className="text-xs text-slate-400">Actividad</p>
          <p className="text-sm font-semibold text-navy">{actividad.nombre}</p>
        </div>
        <Field label="Nombre de archivo o enlace" required error={error || undefined}>
          <TextInput value={nombreArchivo} onChange={(e) => setNombreArchivo(e.target.value)} placeholder="evidencia_final.xlsx" />
        </Field>
        <Field label="Tipo">
          <Select value={tipoArchivo} onChange={(e) => setTipoArchivo(e.target.value as TipoEvidencia)}>
            {TIPOS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </Select>
        </Field>
        <Field label="Comentario">
          <TextArea rows={2} value={comentario} onChange={(e) => setComentario(e.target.value)} />
        </Field>
        <p className="text-[11px] text-slate-400">Esta es una simulación: no se sube ningún archivo real, solo se registra su metadata.</p>
      </div>
    </Modal>
  );
}
