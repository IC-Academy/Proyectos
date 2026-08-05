import React, { useState } from "react";
import { Modal } from "../common/Modal";
import { Button } from "../common/Button";
import { Field, TextInput, TextArea, Select } from "../common/Field";
import { useApp } from "../../context/AppContext";
import type { Objetivo, Actividad, Prioridad } from "../../types";
import { todayIso } from "../../utils/dates";

interface Props {
  abierto: boolean;
  onClose: () => void;
  // El padre puede ser una iniciativa (Objetivo nivel 3, crea Actividad nivel 4)
  // o una actividad (nivel 4, crea subactividad nivel 5).
  padreObjetivo: Objetivo | null;
  padreActividad: Actividad | null;
}

const PRIORIDADES: Prioridad[] = ["Alta", "Media", "Baja"];

export function CrearActividadModal({ abierto, onClose, padreObjetivo, padreActividad }: Props) {
  const { crearActividad, usuarioActual, hijosDeUsuario, actividades } = useApp();
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [responsablePropietarioId, setResponsablePropietarioId] = useState("");
  const [fechaInicio, setFechaInicio] = useState(todayIso());
  const [fechaFin, setFechaFin] = useState("");
  const [peso, setPeso] = useState(50);
  const [prioridad, setPrioridad] = useState<Prioridad>("Media");
  const [dependencia, setDependencia] = useState("");
  const [entregableEsperado, setEntregableEsperado] = useState("");
  const [evidenciaRequerida, setEvidenciaRequerida] = useState(false);
  const [error, setError] = useState("");

  const equipo = usuarioActual ? hijosDeUsuario(usuarioActual.id) : [];

  React.useEffect(() => {
    setNombre("");
    setDescripcion("");
    setResponsablePropietarioId(equipo[0]?.id ?? "");
    setFechaInicio(todayIso());
    setFechaFin("");
    setPeso(50);
    setPrioridad("Media");
    setDependencia("");
    setEntregableEsperado("");
    setEvidenciaRequerida(false);
    setError("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [padreObjetivo, padreActividad, abierto]);

  if (!usuarioActual || (!padreObjetivo && !padreActividad)) return null;

  const objetivoId = padreObjetivo ? padreObjetivo.id : padreActividad!.objetivoId;
  const parentId = padreActividad ? padreActividad.id : null;
  const nivel = padreActividad ? 5 : 4;
  const etiqueta = nivel === 5 ? "subactividad" : "actividad";
  const nombrePadre = padreActividad ? padreActividad.nombre : padreObjetivo!.nombre;
  const hermanas = actividades.filter((a) => (parentId ? a.parentId === parentId : a.objetivoId === objetivoId && a.parentId === null));
  const sumaPeso = hermanas.reduce((s, a) => s + a.peso, 0);

  function crear() {
    if (!nombre.trim()) return setError("El nombre es obligatorio.");
    if (!responsablePropietarioId) return setError("Debes asignar un responsable.");
    if (!fechaFin) return setError("La fecha fin es obligatoria.");
    if (fechaFin < fechaInicio) return setError("La fecha fin no puede ser anterior a la fecha de inicio.");
    if (peso < 0 || peso > 100) return setError("El peso debe estar entre 0 y 100.");

    crearActividad({
      parentId,
      objetivoId,
      nivel: nivel as 4 | 5,
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      responsablePropietarioId,
      fechaInicio,
      fechaFin,
      peso,
      prioridad,
      dependencia: dependencia.trim() || undefined,
      entregableEsperado: entregableEsperado.trim() || undefined,
      evidenciaRequerida,
      creadoPor: usuarioActual!.id,
    });
    onClose();
  }

  return (
    <Modal
      abierto={abierto}
      onClose={onClose}
      titulo={`Crear ${etiqueta} bajo "${nombrePadre}"`}
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
        <Field label="Responsable (propietario y ejecutor inicial)" required>
          <Select value={responsablePropietarioId} onChange={(e) => setResponsablePropietarioId(e.target.value)}>
            {equipo.length === 0 && <option value="">Sin colaboradores en tu equipo</option>}
            {equipo.map((u) => (
              <option key={u.id} value={u.id}>{u.nombre}</option>
            ))}
          </Select>
        </Field>
        <Field label="Prioridad">
          <Select value={prioridad} onChange={(e) => setPrioridad(e.target.value as Prioridad)}>
            {PRIORIDADES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </Select>
        </Field>
        <Field label="Fecha inicio" required>
          <TextInput type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
        </Field>
        <Field label="Fecha fin" required>
          <TextInput type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} min={fechaInicio} />
        </Field>
        <Field label="Peso (%)" required hint={`Elementos hermanos existentes suman ${sumaPeso}%`}>
          <TextInput type="number" min={0} max={100} value={peso} onChange={(e) => setPeso(Number(e.target.value))} />
        </Field>
        <Field label="Dependencia">
          <TextInput value={dependencia} onChange={(e) => setDependencia(e.target.value)} placeholder="Ej. Depende de la actividad X" />
        </Field>
        <Field label="Entregable esperado" className="md:col-span-2">
          <TextInput value={entregableEsperado} onChange={(e) => setEntregableEsperado(e.target.value)} />
        </Field>
        <label className="flex items-center gap-2 text-sm text-slate-600 md:col-span-2">
          <input type="checkbox" checked={evidenciaRequerida} onChange={(e) => setEvidenciaRequerida(e.target.checked)} />
          Requiere evidencia obligatoria para poder cerrarse
        </label>
      </div>
      {error && <p className="text-xs text-danger mt-3">{error}</p>}
    </Modal>
  );
}
