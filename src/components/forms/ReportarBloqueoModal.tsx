import React, { useState } from "react";
import { Modal } from "../common/Modal";
import { Button } from "../common/Button";
import { Field, TextArea, Select } from "../common/Field";
import { useApp } from "../../context/AppContext";
import type { Actividad, TipoBloqueo, UrgenciaBloqueo } from "../../types";

interface Props {
  abierto: boolean;
  onClose: () => void;
  actividad: Actividad | null;
}

const TIPOS: TipoBloqueo[] = [
  "Dependencia interna",
  "Falta de información",
  "Falta de autorización",
  "Falta de recurso",
  "Problema técnico",
  "Dependencia externa",
  "Otro",
];
const URGENCIAS: UrgenciaBloqueo[] = ["Baja", "Media", "Alta", "Crítica"];

export function ReportarBloqueoModal({ abierto, onClose, actividad }: Props) {
  const { reportarBloqueo, usuarioActual, getUsuario, objetivos } = useApp();
  const [tipo, setTipo] = useState<TipoBloqueo>("Dependencia interna");
  const [descripcion, setDescripcion] = useState("");
  const [impacto, setImpacto] = useState("");
  const [apoyoRequerido, setApoyoRequerido] = useState("");
  const [urgencia, setUrgencia] = useState<UrgenciaBloqueo>("Media");
  const [error, setError] = useState("");

  React.useEffect(() => {
    setTipo("Dependencia interna");
    setDescripcion("");
    setImpacto("");
    setApoyoRequerido("");
    setUrgencia("Media");
    setError("");
  }, [actividad, abierto]);

  if (!actividad || !usuarioActual) return null;

  const iniciativa = objetivos.find((o) => o.id === actividad.objetivoId);
  const responsableAtender = getUsuario(iniciativa?.responsableId) ?? getUsuario(usuarioActual.liderId);

  function enviar() {
    if (!descripcion.trim() || !impacto.trim() || !apoyoRequerido.trim()) {
      setError("Todos los campos son obligatorios para reportar el bloqueo.");
      return;
    }
    reportarBloqueo({
      actividadId: actividad!.id,
      tipo,
      descripcion: descripcion.trim(),
      impacto: impacto.trim(),
      apoyoRequerido: apoyoRequerido.trim(),
      responsableAtenderId: responsableAtender?.id ?? usuarioActual!.liderId ?? usuarioActual!.id,
      urgencia,
      reportadoPor: usuarioActual!.id,
    });
    onClose();
  }

  return (
    <Modal
      abierto={abierto}
      onClose={onClose}
      titulo="Reportar bloqueo"
      footer={
        <>
          <Button variante="secundario" onClick={onClose}>
            Cancelar
          </Button>
          <Button variante="peligro" onClick={enviar}>
            Reportar bloqueo
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <p className="text-xs text-slate-400">Actividad</p>
          <p className="text-sm font-semibold text-navy">{actividad.nombre}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Tipo de bloqueo" required>
            <Select value={tipo} onChange={(e) => setTipo(e.target.value as TipoBloqueo)}>
              {TIPOS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </Select>
          </Field>
          <Field label="Nivel de urgencia" required>
            <Select value={urgencia} onChange={(e) => setUrgencia(e.target.value as UrgenciaBloqueo)}>
              {URGENCIAS.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="Descripción del bloqueo" required>
          <TextArea rows={2} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
        </Field>
        <Field label="Impacto" required>
          <TextArea rows={2} value={impacto} onChange={(e) => setImpacto(e.target.value)} placeholder="¿Qué se retrasa o afecta si no se resuelve?" />
        </Field>
        <Field label="Apoyo requerido" required>
          <TextArea rows={2} value={apoyoRequerido} onChange={(e) => setApoyoRequerido(e.target.value)} placeholder="¿Qué necesitas para desbloquear la actividad?" />
        </Field>
        <p className="text-[11px] text-slate-400">Se notificará a {responsableAtender?.nombre ?? "tu líder"} para atender este bloqueo.</p>
        {error && <p className="text-xs text-danger">{error}</p>}
      </div>
    </Modal>
  );
}
