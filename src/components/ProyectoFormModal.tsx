import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { Modal, AlertBox } from "./ui";
import { proyectosDeArea } from "../services/selectors";
import { validarPonderaciones } from "../services/calc";

export function ProyectoFormModal({ open, onClose, objetivoId }: { open: boolean; onClose: () => void; objetivoId: string }) {
  const { db, usuarioActual, store } = useApp();
  const objetivo = db.objetivos.find((o) => o.objetivoId === objetivoId);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [indicador, setIndicador] = useState("");
  const [lineaBase, setLineaBase] = useState("");
  const [meta, setMeta] = useState("");
  const [unidad, setUnidad] = useState("");
  const [fechaInicio, setFechaInicio] = useState(objetivo?.fechaInicio ?? "");
  const [fechaFin, setFechaFin] = useState(objetivo?.fechaFin ?? "");
  const [ponderacion, setPonderacion] = useState("100");
  const [evidenciaEsperada, setEvidenciaEsperada] = useState("");
  const [dependencias, setDependencias] = useState("");
  const [riesgos, setRiesgos] = useState("");

  if (!usuarioActual || !objetivo) return null;
  const existentes = proyectosDeArea(db, usuarioActual.areaId, objetivoId);
  const check = validarPonderaciones([...existentes.map((p) => ({ ponderacion: p.ponderacion })), { ponderacion: Number(ponderacion) || 0 }]);

  function limpiar() {
    setNombre("");
    setDescripcion("");
    setIndicador("");
    setLineaBase("");
    setMeta("");
    setUnidad("");
    setPonderacion("100");
    setEvidenciaEsperada("");
    setDependencias("");
    setRiesgos("");
  }

  function crear() {
    if (!usuarioActual) return;
    store.crearProyecto(
      {
        objetivoId,
        areaId: usuarioActual.areaId,
        nombre,
        descripcion,
        indicador,
        lineaBase: Number(lineaBase) || 0,
        meta: Number(meta) || 0,
        unidad,
        fechaInicio,
        fechaFin,
        ponderacion: Number(ponderacion) || 0,
        responsableId: usuarioActual.usuarioId,
        evidenciaEsperada,
        dependencias,
        riesgos,
      },
      usuarioActual.usuarioId
    );
    limpiar();
    onClose();
  }

  const puedeCrear = nombre.trim().length > 2 && descripcion.trim().length > 5 && fechaInicio && fechaFin;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nuevo proyecto / meta de área"
      sub={`Derivado del objetivo: ${objetivo.nombreCorto}`}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn btn-primary" disabled={!puedeCrear} onClick={crear}>
            Crear proyecto
          </button>
        </>
      }
    >
      <div className="form-grid">
        <div className="field full">
          <label>Objetivo superior</label>
          <input value={objetivo.nombreCorto} disabled />
        </div>
        <div className="field full">
          <label>Nombre del proyecto</label>
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Plan Comercial 2025-2026" />
        </div>
        <div className="field full">
          <label>Descripción</label>
          <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
        </div>
        <div className="field full">
          <label>Indicador</label>
          <input value={indicador} onChange={(e) => setIndicador(e.target.value)} />
        </div>
        <div className="field">
          <label>Línea base</label>
          <input type="number" value={lineaBase} onChange={(e) => setLineaBase(e.target.value)} />
        </div>
        <div className="field">
          <label>Meta</label>
          <input type="number" value={meta} onChange={(e) => setMeta(e.target.value)} />
        </div>
        <div className="field">
          <label>Unidad</label>
          <input value={unidad} onChange={(e) => setUnidad(e.target.value)} />
        </div>
        <div className="field">
          <label>Ponderación dentro del área (%)</label>
          <input type="number" value={ponderacion} onChange={(e) => setPonderacion(e.target.value)} />
        </div>
        <div className="field">
          <label>Fecha inicial</label>
          <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
        </div>
        <div className="field">
          <label>Fecha final</label>
          <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
        </div>
        <div className="field full">
          <label>Responsable</label>
          <input value={usuarioActual.nombre} disabled />
        </div>
        <div className="field full">
          <label>Evidencia esperada</label>
          <textarea value={evidenciaEsperada} onChange={(e) => setEvidenciaEsperada(e.target.value)} />
        </div>
        <div className="field full">
          <label>Dependencias</label>
          <input value={dependencias} onChange={(e) => setDependencias(e.target.value)} />
        </div>
        <div className="field full">
          <label>Riesgos</label>
          <input value={riesgos} onChange={(e) => setRiesgos(e.target.value)} />
        </div>
      </div>
      {existentes.length > 0 && (
        <AlertBox tipo={check.ok ? "success" : "warn"}>
          {existentes.length} proyecto(s) existente(s) en tu área para este objetivo. Suma total de ponderaciones incluyendo este: <b>{check.suma}%</b>
          {!check.ok && " — debe sumar 100% entre todos los proyectos del área."}
        </AlertBox>
      )}
    </Modal>
  );
}
