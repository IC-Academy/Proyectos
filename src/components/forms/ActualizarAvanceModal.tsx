import React, { useState } from "react";
import { Modal } from "../common/Modal";
import { Button } from "../common/Button";
import { Field, TextArea, Select, TextInput } from "../common/Field";
import { ProgressBar } from "../common/ProgressBar";
import { useApp } from "../../context/AppContext";
import type { Actividad, EstatusElemento, TipoEvidencia } from "../../types";

interface Props {
  abierto: boolean;
  onClose: () => void;
  actividad: Actividad | null;
}

const ESTATUS_OPCIONES: EstatusElemento[] = ["Sin iniciar", "En tiempo", "En riesgo", "Retrasado", "Completado"];
const TIPOS_EVIDENCIA: TipoEvidencia[] = ["PDF", "Excel", "Word", "Imagen", "Enlace"];

export function ActualizarAvanceModal({ abierto, onClose, actividad }: Props) {
  const { actualizarAvance, agregarEvidencia, evidencias, usuarioActual } = useApp();
  const [avance, setAvance] = useState(0);
  const [comentario, setComentario] = useState("");
  const [estatus, setEstatus] = useState<EstatusElemento>("En tiempo");
  const [adjuntarEvidencia, setAdjuntarEvidencia] = useState(false);
  const [nombreEvidencia, setNombreEvidencia] = useState("");
  const [tipoEvidencia, setTipoEvidencia] = useState<TipoEvidencia>("PDF");
  const [error, setError] = useState("");

  React.useEffect(() => {
    if (actividad) {
      setAvance(actividad.avanceValidado);
      setComentario("");
      setEstatus(actividad.estatus === "Sin iniciar" ? "En tiempo" : actividad.estatus);
      setAdjuntarEvidencia(false);
      setNombreEvidencia("");
      setError("");
    }
  }, [actividad, abierto]);

  if (!actividad || !usuarioActual) return null;

  const tieneEvidenciaPrevia = evidencias.some((e) => e.actividadId === actividad.id);

  function validarYGuardar() {
    if (!comentario.trim()) {
      setError("El comentario es obligatorio para registrar un avance.");
      return;
    }
    if (avance < 0 || avance > 100) {
      setError("El avance debe estar entre 0 y 100.");
      return;
    }
    const estatusFinal: EstatusElemento = avance >= 100 ? "Completado" : estatus;
    if (estatusFinal === "Completado" && actividad!.evidenciaRequerida && !tieneEvidenciaPrevia && !(adjuntarEvidencia && nombreEvidencia.trim())) {
      setError("Esta actividad requiere evidencia obligatoria antes de poder cerrarse como Completada.");
      return;
    }
    actualizarAvance(
      actividad!.id,
      "actividad",
      avance,
      comentario.trim(),
      usuarioActual!.id,
      adjuntarEvidencia && nombreEvidencia.trim() ? nombreEvidencia.trim() : undefined,
      estatusFinal
    );
    if (adjuntarEvidencia && nombreEvidencia.trim()) {
      agregarEvidencia({ actividadId: actividad!.id, nombreArchivo: nombreEvidencia.trim(), tipoArchivo: tipoEvidencia, usuarioId: usuarioActual!.id, comentario: "Adjuntada junto con actualización de avance." });
    }
    onClose();
  }

  return (
    <Modal
      abierto={abierto}
      onClose={onClose}
      titulo="Actualizar avance"
      footer={
        <>
          <Button variante="secundario" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={validarYGuardar}>Guardar avance</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <p className="text-xs text-slate-400">Actividad</p>
          <p className="text-sm font-semibold text-navy">{actividad.nombre}</p>
        </div>

        <div>
          <p className="text-xs text-slate-400 mb-1">Avance validado actual</p>
          <ProgressBar valor={actividad.avanceValidado} mostrarValor />
        </div>

        <Field label={`Nuevo porcentaje de avance (${avance}%)`} required>
          <input type="range" min={0} max={100} value={avance} onChange={(e) => setAvance(Number(e.target.value))} className="w-full accent-brand-blue" />
        </Field>

        <Field label="Estatus" required>
          <Select value={estatus} onChange={(e) => setEstatus(e.target.value as EstatusElemento)} disabled={avance >= 100}>
            {ESTATUS_OPCIONES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
        </Field>

        <Field label="Comentario" required error={error && !comentario.trim() ? error : undefined}>
          <TextArea rows={3} value={comentario} onChange={(e) => setComentario(e.target.value)} placeholder="Describe el avance logrado, pendientes o contexto relevante..." />
        </Field>

        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={adjuntarEvidencia} onChange={(e) => setAdjuntarEvidencia(e.target.checked)} />
          Adjuntar evidencia (opcional)
        </label>

        {adjuntarEvidencia && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nombre de archivo o enlace">
              <TextInput value={nombreEvidencia} onChange={(e) => setNombreEvidencia(e.target.value)} placeholder="reporte_avance.pdf" />
            </Field>
            <Field label="Tipo">
              <Select value={tipoEvidencia} onChange={(e) => setTipoEvidencia(e.target.value as TipoEvidencia)}>
                {TIPOS_EVIDENCIA.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </Select>
            </Field>
          </div>
        )}

        {error && <p className="text-xs text-danger">{error}</p>}
        <p className="text-[11px] text-slate-400">El avance quedará como "Pendiente de validación" hasta que tu líder lo apruebe.</p>
      </div>
    </Modal>
  );
}
