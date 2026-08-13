import React, { useState } from "react";
import { useApp } from "../context/useApp";
import { Modal, AlertBox } from "./ui";
import type { PrioridadActividad } from "../types";

interface Props {
  open: boolean;
  onClose: () => void;
  proyectoId: string;
  objetivoId: string;
  actividadPadreId: string | null;
  modo: "actividad" | "subactividad";
  creadoPorId: string;
  areaCreadorId: string;
  equipo?: { usuarioId: string; nombre: string }[]; // solo en modo 'actividad' (líder)
}

export function ActividadFormModal({ open, onClose, proyectoId, objetivoId, actividadPadreId, modo, creadoPorId, areaCreadorId, equipo = [] }: Props) {
  const { db, store } = useApp();
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [responsableId, setResponsableId] = useState(modo === "subactividad" ? creadoPorId : equipo[0]?.usuarioId ?? "");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [prioridad, setPrioridad] = useState<PrioridadActividad>("Media");
  const [ponderacion, setPonderacion] = useState("100");
  const [indicador, setIndicador] = useState("");
  const [meta, setMeta] = useState("");
  const [evidenciaEsperada, setEvidenciaEsperada] = useState("");
  const [dependeDeActividadId, setDependeDeActividadId] = useState("");
  const [comentarios, setComentarios] = useState("");

  const [requiereApoyo, setRequiereApoyo] = useState(false);
  const [areaRequeridaId, setAreaRequeridaId] = useState("");
  const [personaRequeridaId, setPersonaRequeridaId] = useState("");
  const [cargaEstimadaHrs, setCargaEstimadaHrs] = useState("8");
  const [justificacion, setJustificacion] = useState("");
  const [dependenciasSolicitud, setDependenciasSolicitud] = useState("");

  const proyecto = db.proyectos.find((p) => p.proyectoId === proyectoId);
  const hermanos = db.actividades.filter((a) => a.proyectoId === proyectoId && a.actividadId !== actividadPadreId);
  const areasDisponibles = db.areas.filter((a) => a.areaId !== areaCreadorId);
  const personasArea = areasDisponibles.length > 0 ? db.usuarios.filter((u) => u.areaId === areaRequeridaId && u.activo) : [];

  function limpiar() {
    setNombre("");
    setDescripcion("");
    setFechaInicio("");
    setFechaFin("");
    setPonderacion("100");
    setIndicador("");
    setMeta("");
    setEvidenciaEsperada("");
    setDependeDeActividadId("");
    setComentarios("");
    setRequiereApoyo(false);
    setAreaRequeridaId("");
    setPersonaRequeridaId("");
    setJustificacion("");
    setDependenciasSolicitud("");
  }

  function crear() {
    if (!nombre || !fechaInicio || !fechaFin) return;

    if (requiereApoyo) {
      if (!areaRequeridaId || !personaRequeridaId || !justificacion) return;
      const nuevaId = store.crearActividad(
        {
          proyectoId,
          actividadPadreId,
          nombre,
          descripcion,
          responsableId: creadoPorId,
          areaResponsableId: areaCreadorId,
          fechaInicio,
          fechaFin,
          prioridad,
          ponderacion: Number(ponderacion) || 0,
          indicador,
          meta,
          evidenciaEsperada,
          dependeDeActividadId: dependeDeActividadId || null,
          comentariosTexto: comentarios,
          requiereApoyoInterarea: true,
          estado: "Pendiente de aprobación",
        },
        creadoPorId
      );
      store.crearSolicitud(
        {
          objetivoId,
          proyectoId,
          actividadOrigenId: nuevaId,
          areaSolicitanteId: areaCreadorId,
          personaRequeridaId,
          areaRequeridaId,
          descripcionActividad: nombre,
          fechaInicio,
          fechaFin,
          prioridad,
          cargaEstimadaHrs: Number(cargaEstimadaHrs) || 0,
          justificacion,
          dependencias: dependenciasSolicitud,
        },
        creadoPorId
      );
    } else {
      store.crearActividad(
        {
          proyectoId,
          actividadPadreId,
          nombre,
          descripcion,
          responsableId,
          areaResponsableId: modo === "subactividad" ? areaCreadorId : db.usuarios.find((u) => u.usuarioId === responsableId)?.areaId ?? areaCreadorId,
          fechaInicio,
          fechaFin,
          prioridad,
          ponderacion: Number(ponderacion) || 0,
          indicador,
          meta,
          evidenciaEsperada,
          dependeDeActividadId: dependeDeActividadId || null,
          comentariosTexto: comentarios,
          requiereApoyoInterarea: false,
          estado: "Pendiente",
        },
        creadoPorId
      );
    }
    limpiar();
    onClose();
  }

  const puedeCrear = nombre.trim().length > 2 && !!fechaInicio && !!fechaFin && (!requiereApoyo || (!!areaRequeridaId && !!personaRequeridaId && justificacion.trim().length > 3)) && (requiereApoyo || modo === "subactividad" || !!responsableId);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={modo === "subactividad" ? "Nueva subactividad" : "Nueva actividad"}
      sub={proyecto ? `Proyecto: ${proyecto.nombre}` : undefined}
      wide
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn btn-primary" disabled={!puedeCrear} onClick={crear}>
            {requiereApoyo ? "Enviar solicitud de apoyo" : "Crear"}
          </button>
        </>
      }
    >
      <div className="form-grid">
        <div className="field full">
          <label>Descripción / nombre</label>
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Contactar 50 personas diariamente" />
        </div>
        <div className="field full">
          <label>Detalle</label>
          <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
        </div>

        {modo === "actividad" && !requiereApoyo && (
          <div className="field full">
            <label>Responsable (personas a cargo)</label>
            <select value={responsableId} onChange={(e) => setResponsableId(e.target.value)}>
              <option value="">Selecciona...</option>
              {equipo.map((p) => (
                <option key={p.usuarioId} value={p.usuarioId}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </div>
        )}

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
          <label>Ponderación (%)</label>
          <input type="number" value={ponderacion} onChange={(e) => setPonderacion(e.target.value)} />
        </div>
        <div className="field">
          <label>Indicador</label>
          <input value={indicador} onChange={(e) => setIndicador(e.target.value)} />
        </div>
        <div className="field">
          <label>Meta</label>
          <input value={meta} onChange={(e) => setMeta(e.target.value)} />
        </div>
        <div className="field full">
          <label>Evidencia esperada</label>
          <input value={evidenciaEsperada} onChange={(e) => setEvidenciaEsperada(e.target.value)} />
        </div>
        <div className="field full">
          <label>Depende de (opcional)</label>
          <select value={dependeDeActividadId} onChange={(e) => setDependeDeActividadId(e.target.value)}>
            <option value="">Sin dependencia</option>
            {hermanos.map((h) => (
              <option key={h.actividadId} value={h.actividadId}>
                {h.nombre}
              </option>
            ))}
          </select>
        </div>
        <div className="field full">
          <label>Comentarios</label>
          <textarea value={comentarios} onChange={(e) => setComentarios(e.target.value)} />
        </div>
      </div>

      <div className="divider" />
      <label className="checkbox-row" style={{ marginBottom: 10 }}>
        <input type="checkbox" checked={requiereApoyo} onChange={(e) => setRequiereApoyo(e.target.checked)} />
        <b>Requiere apoyo interárea</b>
      </label>

      {requiereApoyo && (
        <div>
          <AlertBox tipo="info">
            Esta actividad se crea como contenedora (estado "Pendiente de aprobación") y su avance dependerá de la actividad que realice la persona solicitada. Primero debe validar tu líder y después el líder del área requerida.
          </AlertBox>
          <div className="form-grid" style={{ marginTop: 12 }}>
            <div className="field">
              <label>1. Área requerida</label>
              <select
                value={areaRequeridaId}
                onChange={(e) => {
                  setAreaRequeridaId(e.target.value);
                  setPersonaRequeridaId("");
                }}
              >
                <option value="">Selecciona un área...</option>
                {areasDisponibles.map((a) => (
                  <option key={a.areaId} value={a.areaId}>
                    {a.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>2. Persona sugerida</label>
              <select value={personaRequeridaId} onChange={(e) => setPersonaRequeridaId(e.target.value)} disabled={!areaRequeridaId}>
                <option value="">Selecciona...</option>
                {personasArea.map((p) => (
                  <option key={p.usuarioId} value={p.usuarioId}>
                    {p.nombre} — {p.puesto}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>3. Carga estimada (horas)</label>
              <input type="number" value={cargaEstimadaHrs} onChange={(e) => setCargaEstimadaHrs(e.target.value)} />
            </div>
            <div className="field">
              <label>Dependencias del apoyo</label>
              <input value={dependenciasSolicitud} onChange={(e) => setDependenciasSolicitud(e.target.value)} />
            </div>
            <div className="field full">
              <label>4. Justificación</label>
              <textarea value={justificacion} onChange={(e) => setJustificacion(e.target.value)} placeholder="¿Por qué se necesita este apoyo?" />
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
