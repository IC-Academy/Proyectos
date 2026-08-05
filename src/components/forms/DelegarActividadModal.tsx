import React, { useState } from "react";
import { Modal } from "../common/Modal";
import { Button } from "../common/Button";
import { Field, TextArea, Select, TextInput } from "../common/Field";
import { useApp } from "../../context/AppContext";
import type { Actividad } from "../../types";
import { todayIso } from "../../utils/dates";

interface Props {
  abierto: boolean;
  onClose: () => void;
  actividad: Actividad | null;
}

export function DelegarActividadModal({ abierto, onClose, actividad }: Props) {
  const { solicitarDelegacion, usuarios, usuarioActual, getUsuario } = useApp();
  const [destinoId, setDestinoId] = useState("");
  const [motivo, setMotivo] = useState("");
  const [fechaPropuesta, setFechaPropuesta] = useState(todayIso());
  const [comentarios, setComentarios] = useState("");
  const [error, setError] = useState("");

  const equipo = usuarios.filter((u) => u.liderId === usuarioActual?.liderId && u.id !== usuarioActual?.id && u.rol === "Colaborador");

  React.useEffect(() => {
    setDestinoId(equipo[0]?.id ?? "");
    setMotivo("");
    setComentarios("");
    setFechaPropuesta(todayIso());
    setError("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actividad, abierto]);

  if (!actividad || !usuarioActual) return null;
  const propietario = getUsuario(actividad.responsablePropietarioId);

  function enviar() {
    if (!destinoId) {
      setError("Selecciona un integrante de tu equipo para delegar la actividad.");
      return;
    }
    if (!motivo.trim()) {
      setError("El motivo de la delegación es obligatorio.");
      return;
    }
    solicitarDelegacion(actividad!.id, usuarioActual!.id, destinoId, motivo.trim(), fechaPropuesta, comentarios.trim());
    onClose();
  }

  return (
    <Modal
      abierto={abierto}
      onClose={onClose}
      titulo="Delegar actividad"
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
        <Field label="Responsable propietario">
          <TextInput value={propietario?.nombre ?? ""} disabled />
        </Field>
        <Field label="Nuevo ejecutor" required error={error && !destinoId ? error : undefined}>
          <Select value={destinoId} onChange={(e) => setDestinoId(e.target.value)}>
            {equipo.length === 0 && <option value="">No hay integrantes disponibles en tu equipo</option>}
            {equipo.map((u) => (
              <option key={u.id} value={u.id}>{u.nombre} · {u.puesto}</option>
            ))}
          </Select>
        </Field>
        <Field label="Fecha propuesta" required>
          <TextInput type="date" value={fechaPropuesta} onChange={(e) => setFechaPropuesta(e.target.value)} />
        </Field>
        <Field label="Motivo de la delegación" required error={error && !motivo.trim() ? error : undefined}>
          <TextArea rows={2} value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Explica por qué deseas delegar esta actividad..." />
        </Field>
        <Field label="Comentarios adicionales">
          <TextArea rows={2} value={comentarios} onChange={(e) => setComentarios(e.target.value)} />
        </Field>
        <p className="text-[11px] text-slate-400">Solo puedes delegar a integrantes de tu mismo equipo. La solicitud será enviada a tu líder para aprobación.</p>
        {error && <p className="text-xs text-danger">{error}</p>}
      </div>
    </Modal>
  );
}
