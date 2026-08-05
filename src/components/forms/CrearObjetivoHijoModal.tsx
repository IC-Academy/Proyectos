import React, { useState } from "react";
import { Modal } from "../common/Modal";
import { Button } from "../common/Button";
import { Field, TextInput, TextArea, Select } from "../common/Field";
import { useApp } from "../../context/AppContext";
import type { Objetivo, Prioridad } from "../../types";
import { todayIso } from "../../utils/dates";

interface Props {
  abierto: boolean;
  onClose: () => void;
  padre: Objetivo | null;
}

const PRIORIDADES: Prioridad[] = ["Alta", "Media", "Baja"];

export function CrearObjetivoHijoModal({ abierto, onClose, padre }: Props) {
  const { crearObjetivo, usuarioActual, objetivos } = useApp();
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fechaInicio, setFechaInicio] = useState(todayIso());
  const [fechaFin, setFechaFin] = useState("");
  const [prioridad, setPrioridad] = useState<Prioridad>("Media");
  const [indicador, setIndicador] = useState("");
  const [meta, setMeta] = useState(100);
  const [unidad, setUnidad] = useState("%");
  const [peso, setPeso] = useState(50);
  const [error, setError] = useState("");

  React.useEffect(() => {
    setNombre("");
    setDescripcion("");
    setFechaInicio(padre?.fechaInicio ?? todayIso());
    setFechaFin("");
    setPrioridad("Media");
    setIndicador("% de avance");
    setMeta(100);
    setUnidad("%");
    setPeso(50);
    setError("");
  }, [padre, abierto]);

  if (!padre || !usuarioActual) return null;

  const nivelHijo = padre.nivel === 1 ? 2 : 3;
  const etiqueta = nivelHijo === 2 ? "objetivo de área" : "iniciativa";
  const hermanos = objetivos.filter((o) => o.parentId === padre.id);
  const sumaPeso = hermanos.reduce((s, o) => s + o.peso, 0);

  function crear() {
    if (!nombre.trim()) return setError("El nombre es obligatorio.");
    if (!fechaFin) return setError("La fecha fin es obligatoria.");
    if (fechaFin < fechaInicio) return setError("La fecha fin no puede ser anterior a la fecha de inicio.");
    if (peso < 0 || peso > 100) return setError("El peso debe estar entre 0 y 100.");

    crearObjetivo({
      parentId: padre!.id,
      nivel: nivelHijo as 2 | 3,
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      responsableId: usuarioActual!.id,
      participantesIds: [usuarioActual!.id],
      area: padre!.area,
      fechaInicio,
      fechaFin,
      prioridad,
      indicador: indicador.trim() || "% de avance",
      valorBase: 0,
      meta,
      unidad,
      peso,
      creadoPor: usuarioActual!.id,
    });
    onClose();
  }

  return (
    <Modal
      abierto={abierto}
      onClose={onClose}
      titulo={`Crear ${etiqueta} bajo "${padre.nombre}"`}
      ancho="lg"
      footer={
        <>
          <Button variante="secundario" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={crear}>Crear {etiqueta}</Button>
        </>
      }
    >
      <div className="grid md:grid-cols-2 gap-4">
        <Field label="Nombre" required className="md:col-span-2">
          <TextInput value={nombre} onChange={(e) => setNombre(e.target.value)} />
        </Field>
        <Field label="Descripción" className="md:col-span-2">
          <TextArea rows={2} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
        </Field>
        <Field label="Fecha inicio" required>
          <TextInput type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
        </Field>
        <Field label="Fecha fin" required>
          <TextInput type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} min={fechaInicio} />
        </Field>
        <Field label="Prioridad">
          <Select value={prioridad} onChange={(e) => setPrioridad(e.target.value as Prioridad)}>
            {PRIORIDADES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </Select>
        </Field>
        <Field label="Peso (%)" required hint={`Elementos hermanos existentes suman ${sumaPeso}%`}>
          <TextInput type="number" min={0} max={100} value={peso} onChange={(e) => setPeso(Number(e.target.value))} />
        </Field>
        <Field label="Indicador">
          <TextInput value={indicador} onChange={(e) => setIndicador(e.target.value)} />
        </Field>
        <Field label="Meta">
          <TextInput type="number" value={meta} onChange={(e) => setMeta(Number(e.target.value))} />
        </Field>
      </div>
      {error && <p className="text-xs text-danger mt-3">{error}</p>}
    </Modal>
  );
}
