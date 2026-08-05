import React, { useState } from "react";
import { Modal } from "../common/Modal";
import { Button } from "../common/Button";
import { Field, TextArea, TextInput } from "../common/Field";
import { useApp } from "../../context/AppContext";
import type { Actividad } from "../../types";
import { formatFecha } from "../../utils/dates";

interface Props {
  abierto: boolean;
  onClose: () => void;
  actividad: Actividad | null;
}

export function SolicitarCambioFechaModal({ abierto, onClose, actividad }: Props) {
  const { solicitarCambio, usuarioActual } = useApp();
  const [nuevaFecha, setNuevaFecha] = useState("");
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState("");

  React.useEffect(() => {
    setNuevaFecha(actividad?.fechaFin ?? "");
    setMotivo("");
    setError("");
  }, [actividad, abierto]);

  if (!actividad || !usuarioActual) return null;

  function enviar() {
    if (!nuevaFecha) {
      setError("Selecciona la nueva fecha propuesta.");
      return;
    }
    if (nuevaFecha < actividad!.fechaInicio) {
      setError("La nueva fecha no puede ser anterior a la fecha de inicio.");
      return;
    }
    if (!motivo.trim()) {
      setError("El motivo es obligatorio.");
      return;
    }
    solicitarCambio({
      elementoId: actividad!.id,
      tipoElemento: "actividad",
      tipo: "Cambio de fecha",
      valorAnterior: actividad!.fechaFin,
      valorSolicitado: nuevaFecha,
      motivo: motivo.trim(),
      solicitadoPor: usuarioActual!.id,
    });
    onClose();
  }

  return (
    <Modal
      abierto={abierto}
      onClose={onClose}
      titulo="Solicitar cambio de fecha"
      footer={
        <>
          <Button variante="secundario" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={enviar}>Enviar solicitud</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <p className="text-xs text-slate-400">Actividad</p>
          <p className="text-sm font-semibold text-navy">{actividad.nombre}</p>
        </div>
        <Field label="Fecha compromiso actual">
          <TextInput value={formatFecha(actividad.fechaFin)} disabled />
        </Field>
        <Field label="Nueva fecha propuesta" required>
          <TextInput type="date" value={nuevaFecha} onChange={(e) => setNuevaFecha(e.target.value)} min={actividad.fechaInicio} />
        </Field>
        <Field label="Motivo" required>
          <TextArea rows={3} value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Explica la razón del cambio de fecha solicitado..." />
        </Field>
        <p className="text-[11px] text-slate-400">La solicitud quedará pendiente de aprobación en el módulo de Aprobaciones.</p>
        {error && <p className="text-xs text-danger">{error}</p>}
      </div>
    </Modal>
  );
}
