import React, { useState } from "react";
import { useApp } from "../context/useApp";
import { Modal } from "./ui";
import type { Actividad, PrioridadActividad } from "../types";

export function SolicitudApoyoModal({ open, onClose, actividad, solicitanteId }: { open: boolean; onClose: () => void; actividad: Actividad; solicitanteId: string }) {
  const { db, store } = useApp();
  const solicitante = db.usuarios.find((u) => u.usuarioId === solicitanteId);
  const proyecto = db.proyectos.find((p) => p.proyectoId === actividad.proyectoId);
  const [areaRequeridaId, setAreaRequeridaId] = useState("");
  const [personaRequeridaId, setPersonaRequeridaId] = useState("");
  const [descripcionActividad, setDescripcionActividad] = useState(`Apoyo para: ${actividad.nombre}`);
  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().slice(0, 10));
  const [fechaFin, setFechaFin] = useState(actividad.fechaFin);
  const [prioridad, setPrioridad] = useState<PrioridadActividad>(actividad.prioridad);
  const [cargaEstimadaHrs, setCargaEstimadaHrs] = useState("8");
  const [justificacion, setJustificacion] = useState("");
  const [dependencias, setDependencias] = useState("");

  if (!solicitante || !proyecto) return null;
  const areas = db.areas.filter((a) => a.areaId !== solicitante.areaId);
  const personas = db.usuarios.filter((u) => u.areaId === areaRequeridaId && u.activo);

  const puedeEnviar = !!areaRequeridaId && !!personaRequeridaId && descripcionActividad.trim().length > 3 && justificacion.trim().length > 3;

  function enviar() {
    store.crearSolicitud(
      {
        objetivoId: proyecto!.objetivoId,
        proyectoId: actividad.proyectoId,
        actividadOrigenId: actividad.actividadId,
        areaSolicitanteId: solicitante!.areaId,
        personaRequeridaId,
        areaRequeridaId,
        descripcionActividad,
        fechaInicio,
        fechaFin,
        prioridad,
        cargaEstimadaHrs: Number(cargaEstimadaHrs) || 0,
        justificacion,
        dependencias,
      },
      solicitanteId
    );
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Solicitar apoyo a otra área"
      sub={`Actividad de origen: ${actividad.nombre}`}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn btn-primary" disabled={!puedeEnviar} onClick={enviar}>
            Enviar solicitud
          </button>
        </>
      }
    >
      <div className="form-grid">
        <div className="field">
          <label>Área requerida</label>
          <select
            value={areaRequeridaId}
            onChange={(e) => {
              setAreaRequeridaId(e.target.value);
              setPersonaRequeridaId("");
            }}
          >
            <option value="">Selecciona...</option>
            {areas.map((a) => (
              <option key={a.areaId} value={a.areaId}>
                {a.nombre}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Persona sugerida</label>
          <select value={personaRequeridaId} onChange={(e) => setPersonaRequeridaId(e.target.value)} disabled={!areaRequeridaId}>
            <option value="">Selecciona...</option>
            {personas.map((p) => (
              <option key={p.usuarioId} value={p.usuarioId}>
                {p.nombre} — {p.puesto}
              </option>
            ))}
          </select>
        </div>
        <div className="field full">
          <label>Descripción de la actividad requerida</label>
          <textarea value={descripcionActividad} onChange={(e) => setDescripcionActividad(e.target.value)} />
        </div>
        <div className="field">
          <label>Fecha inicial</label>
          <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
        </div>
        <div className="field">
          <label>Fecha final</label>
          <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
        </div>
        <div className="field">
          <label>Prioridad</label>
          <select value={prioridad} onChange={(e) => setPrioridad(e.target.value as PrioridadActividad)}>
            {["Baja", "Media", "Alta", "Crítica"].map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Carga estimada (horas)</label>
          <input type="number" value={cargaEstimadaHrs} onChange={(e) => setCargaEstimadaHrs(e.target.value)} />
        </div>
        <div className="field full">
          <label>Justificación</label>
          <textarea value={justificacion} onChange={(e) => setJustificacion(e.target.value)} />
        </div>
        <div className="field full">
          <label>Dependencias</label>
          <input value={dependencias} onChange={(e) => setDependencias(e.target.value)} />
        </div>
      </div>
    </Modal>
  );
}
