import React, { useState } from "react";
import { Modal } from "../common/Modal";
import { Button } from "../common/Button";
import { Field, TextInput, TextArea, Select } from "../common/Field";
import { useApp } from "../../context/AppContext";
import type { Area, Prioridad } from "../../types";
import { todayIso } from "../../utils/dates";

interface Props {
  abierto: boolean;
  onClose: () => void;
}

const AREAS: Area[] = ["Operaciones", "Recursos Humanos", "Finanzas", "Tecnología", "Comercial"];
const PRIORIDADES: Prioridad[] = ["Alta", "Media", "Baja"];

export function CrearObjetivoModal({ abierto, onClose }: Props) {
  const { crearObjetivo, usuarios, usuarioActual, objetivos } = useApp();
  const lideres = usuarios.filter((u) => u.rol === "Lider");

  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [area, setArea] = useState<Area>("Operaciones");
  const [responsableId, setResponsableId] = useState(lideres[0]?.id ?? "");
  const [participantesIds, setParticipantesIds] = useState<string[]>([]);
  const [fechaInicio, setFechaInicio] = useState(todayIso());
  const [fechaFin, setFechaFin] = useState("");
  const [prioridad, setPrioridad] = useState<Prioridad>("Alta");
  const [indicador, setIndicador] = useState("");
  const [valorBase, setValorBase] = useState(0);
  const [meta, setMeta] = useState(0);
  const [unidad, setUnidad] = useState("%");
  const [peso, setPeso] = useState(25);
  const [criterioExito, setCriterioExito] = useState("");
  const [error, setError] = useState("");

  const raices = objetivos.filter((o) => o.nivel === 1);
  const sumaPesoActual = raices.reduce((s, o) => s + o.peso, 0);

  function limpiar() {
    setNombre("");
    setDescripcion("");
    setArea("Operaciones");
    setResponsableId(lideres[0]?.id ?? "");
    setParticipantesIds([]);
    setFechaInicio(todayIso());
    setFechaFin("");
    setPrioridad("Alta");
    setIndicador("");
    setValorBase(0);
    setMeta(0);
    setUnidad("%");
    setPeso(25);
    setCriterioExito("");
    setError("");
  }

  function crear() {
    if (!nombre.trim()) return setError("El nombre es obligatorio.");
    if (!responsableId) return setError("Debes asignar un líder responsable.");
    if (!fechaFin) return setError("La fecha fin es obligatoria.");
    if (fechaFin < fechaInicio) return setError("La fecha fin no puede ser anterior a la fecha de inicio.");
    if (peso < 0 || peso > 100) return setError("El peso debe estar entre 0 y 100.");
    if (!usuarioActual) return;

    crearObjetivo({
      parentId: null,
      nivel: 1,
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      responsableId,
      participantesIds: Array.from(new Set([responsableId, ...participantesIds])),
      area,
      fechaInicio,
      fechaFin,
      prioridad,
      indicador: indicador.trim() || "% de avance",
      valorBase,
      meta,
      unidad,
      peso,
      criterioExito: criterioExito.trim() || undefined,
      creadoPor: usuarioActual.id,
    });
    limpiar();
    onClose();
  }

  const colaboradores = usuarios.filter((u) => u.rol === "Colaborador");

  return (
    <Modal
      abierto={abierto}
      onClose={() => {
        onClose();
      }}
      titulo="Crear objetivo estratégico"
      ancho="lg"
      footer={
        <>
          <Button variante="secundario" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={crear}>Crear y asignar</Button>
        </>
      }
    >
      <div className="grid md:grid-cols-2 gap-4">
        <Field label="Nombre del objetivo" required className="md:col-span-2">
          <TextInput value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Reducir costos operativos en 15%" />
        </Field>
        <Field label="Descripción" className="md:col-span-2">
          <TextArea rows={2} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
        </Field>
        <Field label="Área">
          <Select value={area} onChange={(e) => setArea(e.target.value as Area)}>
            {AREAS.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </Select>
        </Field>
        <Field label="Líder responsable" required>
          <Select value={responsableId} onChange={(e) => setResponsableId(e.target.value)}>
            {lideres.map((l) => (
              <option key={l.id} value={l.id}>{l.nombre} · {l.puesto}</option>
            ))}
          </Select>
        </Field>
        <Field label="Fecha inicio" required>
          <TextInput type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
        </Field>
        <Field label="Fecha fin" required error={error.includes("fecha fin") ? error : undefined}>
          <TextInput type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} min={fechaInicio} />
        </Field>
        <Field label="Prioridad">
          <Select value={prioridad} onChange={(e) => setPrioridad(e.target.value as Prioridad)}>
            {PRIORIDADES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </Select>
        </Field>
        <Field label="Peso (%)" required hint={`Objetivos estratégicos existentes suman ${sumaPesoActual}%`}>
          <TextInput type="number" min={0} max={100} value={peso} onChange={(e) => setPeso(Number(e.target.value))} />
        </Field>
        <Field label="Indicador">
          <TextInput value={indicador} onChange={(e) => setIndicador(e.target.value)} placeholder="Ej. Costo operativo mensual" />
        </Field>
        <Field label="Unidad">
          <TextInput value={unidad} onChange={(e) => setUnidad(e.target.value)} placeholder="%, MXN, días..." />
        </Field>
        <Field label="Valor base">
          <TextInput type="number" value={valorBase} onChange={(e) => setValorBase(Number(e.target.value))} />
        </Field>
        <Field label="Meta">
          <TextInput type="number" value={meta} onChange={(e) => setMeta(Number(e.target.value))} />
        </Field>
        <Field label="Criterio de éxito" className="md:col-span-2">
          <TextInput value={criterioExito} onChange={(e) => setCriterioExito(e.target.value)} placeholder="¿Cómo sabremos que el objetivo se cumplió?" />
        </Field>
        <Field label="Participantes adicionales" className="md:col-span-2" hint="El líder responsable siempre queda incluido">
          <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto border border-slate-200 rounded-lg p-2">
            {colaboradores.map((c) => (
              <label key={c.id} className="flex items-center gap-1.5 text-xs bg-surface px-2 py-1 rounded-md">
                <input
                  type="checkbox"
                  checked={participantesIds.includes(c.id)}
                  onChange={(e) =>
                    setParticipantesIds((prev) => (e.target.checked ? [...prev, c.id] : prev.filter((id) => id !== c.id)))
                  }
                />
                {c.nombre}
              </label>
            ))}
          </div>
        </Field>
      </div>
      {error && <p className="text-xs text-danger mt-3">{error}</p>}
    </Modal>
  );
}
