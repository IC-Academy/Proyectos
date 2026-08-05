import React, { useState } from "react";
import { Modal } from "../common/Modal";
import { Button } from "../common/Button";
import { Field, TextArea, TextInput, Select } from "../common/Field";
import { useApp } from "../../context/AppContext";
import type { Objetivo, TipoSolicitudCambio } from "../../types";
import { formatFecha } from "../../utils/dates";

interface Props {
  abierto: boolean;
  onClose: () => void;
  objetivo: Objetivo | null;
}

export function SolicitarCambioObjetivoModal({ abierto, onClose, objetivo }: Props) {
  const { solicitarCambio, usuarioActual } = useApp();
  const [tipo, setTipo] = useState<TipoSolicitudCambio>("Cambio de fecha");
  const [nuevaFecha, setNuevaFecha] = useState("");
  const [nuevoValor, setNuevoValor] = useState("");
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState("");

  React.useEffect(() => {
    setTipo("Cambio de fecha");
    setNuevaFecha(objetivo?.fechaFin ?? "");
    setNuevoValor("");
    setMotivo("");
    setError("");
  }, [objetivo, abierto]);

  if (!objetivo || !usuarioActual) return null;

  function enviar() {
    if (!motivo.trim()) return setError("El motivo es obligatorio.");
    const valorAnterior = tipo === "Cambio de fecha" ? objetivo!.fechaFin : tipo === "Cambio de alcance" ? `Meta: ${objetivo!.meta} ${objetivo!.unidad}` : `${objetivo!.peso}%`;
    const valorSolicitado = tipo === "Cambio de fecha" ? nuevaFecha : nuevoValor;
    if (!valorSolicitado) return setError("Indica el valor solicitado.");

    solicitarCambio({
      elementoId: objetivo!.id,
      tipoElemento: "objetivo",
      tipo,
      valorAnterior,
      valorSolicitado,
      motivo: motivo.trim(),
      solicitadoPor: usuarioActual!.id,
    });
    onClose();
  }

  return (
    <Modal
      abierto={abierto}
      onClose={onClose}
      titulo="Solicitar cambio"
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
          <p className="text-xs text-slate-400">Objetivo</p>
          <p className="text-sm font-semibold text-navy">{objetivo.nombre}</p>
        </div>
        <Field label="Tipo de cambio" required>
          <Select value={tipo} onChange={(e) => setTipo(e.target.value as TipoSolicitudCambio)}>
            <option value="Cambio de fecha">Cambio de fecha</option>
            <option value="Cambio de alcance">Cambio de alcance</option>
            <option value="Cambio de peso">Cambio de peso</option>
          </Select>
        </Field>
        {tipo === "Cambio de fecha" ? (
          <Field label="Nueva fecha fin" required>
            <TextInput type="date" value={nuevaFecha} onChange={(e) => setNuevaFecha(e.target.value)} min={objetivo.fechaInicio} />
            <p className="text-[11px] text-slate-400 mt-1">Fecha actual: {formatFecha(objetivo.fechaFin)}</p>
          </Field>
        ) : (
          <Field label="Nuevo valor propuesto" required>
            <TextInput value={nuevoValor} onChange={(e) => setNuevoValor(e.target.value)} placeholder={tipo === "Cambio de alcance" ? "Ej. Nueva meta: 5,000,000 MXN" : "Ej. 60%"} />
          </Field>
        )}
        <Field label="Motivo" required error={error || undefined}>
          <TextArea rows={3} value={motivo} onChange={(e) => setMotivo(e.target.value)} />
        </Field>
        <p className="text-[11px] text-slate-400">Este cambio requiere aprobación de Dirección antes de aplicarse.</p>
      </div>
    </Modal>
  );
}
