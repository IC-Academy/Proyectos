import React, { useState } from "react";
import { useApp } from "../context/useApp";
import { AlertBox, Badge, PrioridadBadge } from "./ui";
import type { SolicitudInterarea } from "../types";
import { nombreUsuario, nombreArea } from "../services/selectors";
import { formatoFecha } from "../utils/format";
import { colorEstatusSolicitud } from "../utils/badges";

function DetalleSolicitud({ s }: { s: SolicitudInterarea }) {
  const { db } = useApp();
  const objetivo = db.objetivos.find((o) => o.objetivoId === s.objetivoId);
  const proyecto = db.proyectos.find((p) => p.proyectoId === s.proyectoId);
  return (
    <div className="grid-2" style={{ marginBottom: 10 }}>
      <div>
        <div className="side-panel-row"><span className="k">Objetivo relacionado</span><span className="v">{objetivo?.nombreCorto}</span></div>
        <div className="side-panel-row"><span className="k">Proyecto relacionado</span><span className="v">{proyecto?.nombre}</span></div>
        <div className="side-panel-row"><span className="k">Solicitante</span><span className="v">{nombreUsuario(db, s.solicitanteId)}</span></div>
        <div className="side-panel-row"><span className="k">Área solicitante</span><span className="v">{nombreArea(db, s.areaSolicitanteId)}</span></div>
        <div className="side-panel-row"><span className="k">Persona requerida</span><span className="v">{nombreUsuario(db, s.personaRequeridaId)}</span></div>
        <div className="side-panel-row"><span className="k">Área requerida</span><span className="v">{nombreArea(db, s.areaRequeridaId)}</span></div>
      </div>
      <div>
        <div className="side-panel-row"><span className="k">Fechas</span><span className="v">{formatoFecha(s.fechaInicio)} → {formatoFecha(s.fechaFin)}</span></div>
        <div className="side-panel-row"><span className="k">Prioridad</span><span className="v"><PrioridadBadge prioridad={s.prioridad} /></span></div>
        <div className="side-panel-row"><span className="k">Carga estimada</span><span className="v">{s.cargaEstimadaHrs} hrs</span></div>
        <div className="side-panel-row"><span className="k">Dependencias</span><span className="v">{s.dependencias || "Ninguna"}</span></div>
        <div className="side-panel-row"><span className="k">Creada</span><span className="v">{formatoFecha(s.fechaCreacion)}</span></div>
      </div>
      <div className="full" style={{ gridColumn: "1 / -1" }}>
        <div className="small-text" style={{ marginTop: 4 }}>
          <b>Descripción:</b> {s.descripcionActividad}
        </div>
        <div className="small-text" style={{ marginTop: 4 }}>
          <b>Justificación:</b> {s.justificacion}
        </div>
        {s.motivoRechazo && (
          <div className="small-text" style={{ marginTop: 4, color: "var(--red-600)" }}>
            <b>Motivo de rechazo:</b> {s.motivoRechazo}
          </div>
        )}
      </div>
    </div>
  );
}

/** Bandeja de aprobación: solicitudes esperando decisión del usuario actual (como líder solicitante o líder de área requerida). */
export function BandejaAprobaciones({ usuarioId }: { usuarioId: string }) {
  const { db, store } = useApp();
  const [accionSolicitud, setAccionSolicitud] = useState<{ id: string; tipo: "rechazar" | "cambios"; rol: "Líder solicitante" | "Líder área requerida" } | null>(null);
  const [motivo, setMotivo] = useState("");

  const comoSolicitante = db.solicitudes.filter((s) => s.liderSolicitanteId === usuarioId && s.estatus === "Pendiente del líder solicitante");
  const comoAreaRequerida = db.solicitudes.filter((s) => s.liderAreaRequeridaId === usuarioId && s.estatus === "Pendiente del líder del área requerida");
  const todas = [...comoSolicitante.map((s) => ({ s, rol: "Líder solicitante" as const })), ...comoAreaRequerida.map((s) => ({ s, rol: "Líder área requerida" as const }))];

  if (todas.length === 0) {
    return <AlertBox tipo="info">No tienes solicitudes pendientes de aprobación por el momento.</AlertBox>;
  }

  return (
    <div className="list-clean">
      {todas.map(({ s, rol }) => (
        <div className="card" key={s.solicitudId}>
          <div className="card-header">
            <div>
              <div className="card-title">
                {nombreUsuario(db, s.solicitanteId)} solicita asignar a {nombreUsuario(db, s.personaRequeridaId)}
              </div>
              <div className="card-sub">{s.descripcionActividad}</div>
            </div>
            <div className="flex-gap">
              <Badge color={colorEstatusSolicitud(s.estatus) as never}>{s.estatus}</Badge>
              <span className="badge badge-gray">Rol: {rol}</span>
            </div>
          </div>
          <DetalleSolicitud s={s} />
          {accionSolicitud?.id === s.solicitudId ? (
            <div className="field">
              <label>{accionSolicitud.tipo === "rechazar" ? "Motivo del rechazo" : "Cambios solicitados"}</label>
              <textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} />
              <div className="flex-gap" style={{ marginTop: 8 }}>
                <button
                  className="btn btn-danger btn-sm"
                  disabled={motivo.trim().length < 3}
                  onClick={() => {
                    if (accionSolicitud.tipo === "rechazar") store.rechazarSolicitud(s.solicitudId, usuarioId, motivo, accionSolicitud.rol);
                    else store.solicitarCambios(s.solicitudId, usuarioId, motivo, accionSolicitud.rol);
                    setAccionSolicitud(null);
                    setMotivo("");
                  }}
                >
                  Confirmar
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => setAccionSolicitud(null)}>
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-gap" style={{ flexWrap: "wrap" }}>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => {
                  if (rol === "Líder solicitante") store.aprobarComoSolicitante(s.solicitudId, usuarioId, "Validado por el líder solicitante.");
                  else store.aprobarComoAreaRequerida(s.solicitudId, usuarioId, "Aprobado, capacidad confirmada.");
                }}
              >
                ✓ Aceptar
              </button>
              <button className="btn btn-danger btn-sm" onClick={() => setAccionSolicitud({ id: s.solicitudId, tipo: "rechazar", rol })}>
                ✕ Rechazar
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => setAccionSolicitud({ id: s.solicitudId, tipo: "cambios", rol })}>
                ✎ Solicitar cambios
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/** Lista de solicitudes creadas por el usuario, con su estado actual. */
export function ListaMisSolicitudes({ usuarioId }: { usuarioId: string }) {
  const { db, store } = useApp();
  const mias = db.solicitudes.filter((s) => s.solicitanteId === usuarioId).sort((a, b) => (a.fechaCreacion < b.fechaCreacion ? 1 : -1));

  if (mias.length === 0) return <AlertBox tipo="info">No has creado solicitudes de apoyo interárea.</AlertBox>;

  return (
    <div className="list-clean">
      {mias.map((s) => (
        <div className="card" key={s.solicitudId}>
          <div className="card-header">
            <div>
              <div className="card-title">Apoyo de {nombreUsuario(db, s.personaRequeridaId)} ({nombreArea(db, s.areaRequeridaId)})</div>
              <div className="card-sub">{s.descripcionActividad}</div>
            </div>
            <Badge color={colorEstatusSolicitud(s.estatus) as never}>{s.estatus}</Badge>
          </div>
          <DetalleSolicitud s={s} />
          {s.estatus !== "Aceptada" && s.estatus !== "Rechazada" && s.estatus !== "Cancelada" && (
            <button className="btn btn-secondary btn-sm" onClick={() => store.cancelarSolicitud(s.solicitudId, usuarioId)}>
              Cancelar solicitud
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
