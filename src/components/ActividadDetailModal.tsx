import React, { useState } from "react";
import { useApp } from "../context/useApp";
import { Modal, AlertBox, Badge, EstadoBadge, PrioridadBadge, ProgressBar } from "./ui";
import { formatoFecha, formatoFechaHora } from "../utils/format";
import { avanceEsperadoPorFecha, desviacion as calcDesviacion, esHoja, estadoEfectivo, hijosDe } from "../services/calc";
import { nombreUsuario, nombreArea } from "../services/selectors";
import { ActividadFormModal } from "./ActividadFormModal";
import { SolicitudApoyoModal } from "./SolicitudApoyoModal";

export function ActividadDetailModal({ actividadId, onClose, onAbrirActividad }: { actividadId: string; onClose: () => void; onAbrirActividad?: (id: string) => void }) {
  const { db, usuarioActual, store } = useApp();
  const [tab, setTab] = useState<"detalle" | "sub" | "evidencias" | "comentarios">("detalle");
  const [avanceEdit, setAvanceEdit] = useState<number | null>(null);
  const [comentarioTexto, setComentarioTexto] = useState("");
  const [motivoBloqueo, setMotivoBloqueo] = useState("");
  const [mostrarBloqueo, setMostrarBloqueo] = useState(false);
  const [mostrarSubForm, setMostrarSubForm] = useState(false);
  const [mostrarSolicitud, setMostrarSolicitud] = useState(false);
  const [evNombre, setEvNombre] = useState("");
  const [evTipo, setEvTipo] = useState("Documento");
  const [evComentario, setEvComentario] = useState("");

  const a = db.actividades.find((x) => x.actividadId === actividadId);
  if (!a || !usuarioActual) return null;

  const proyecto = db.proyectos.find((p) => p.proyectoId === a.proyectoId);
  const objetivo = db.objetivos.find((o) => o.objetivoId === proyecto?.objetivoId);
  const responsable = db.usuarios.find((u) => u.usuarioId === a.responsableId);
  const hijos = hijosDe(db.actividades, a.actividadId);
  const evidencias = db.evidencias.filter((e) => e.actividadId === a.actividadId);
  const comentarios = db.comentarios.filter((c) => c.entidadTipo === "Actividad" && c.entidadId === a.actividadId).sort((x, y) => (x.fecha < y.fecha ? 1 : -1));
  const solicitudOrigen = a.origenSolicitudId ? db.solicitudes.find((s) => s.solicitudId === a.origenSolicitudId) : null;
  const esHojaNodo = esHoja(a.actividadId, db.actividades);
  const estado = estadoEfectivo(a, db.actividades);
  const avanceEsperado = avanceEsperadoPorFecha(a.fechaInicio, a.fechaFin);
  const desv = calcDesviacion(a.avance, avanceEsperado);

  const esResponsable = usuarioActual.usuarioId === a.responsableId;
  const esLiderDeResponsable = !!responsable && usuarioActual.usuarioId === responsable.liderId;
  const esAdminODireccion = usuarioActual.rol === "Administrador" || usuarioActual.rol === "Direccion";
  const puedeActualizarAvance = esHojaNodo && esResponsable;
  const puedeCrearSub = esResponsable;
  const puedeReportarBloqueo = esResponsable || esLiderDeResponsable;
  const puedeSolicitarApoyo = esResponsable || esLiderDeResponsable;
  const puedeAgregarEvidencia = esResponsable;
  const puedeValidarEvidencia = esLiderDeResponsable || esAdminODireccion;
  const puedeEliminar = a.creadoPorId === usuarioActual.usuarioId && hijos.length === 0 && !a.origenSolicitudId;

  function guardarAvance() {
    if (avanceEdit === null) return;
    store.actualizarAvance(a!.actividadId, avanceEdit, usuarioActual!.usuarioId);
    setAvanceEdit(null);
  }

  return (
    <Modal open onClose={onClose} title={a.nombre} sub={`${objetivo?.nombreCorto ?? ""} · ${proyecto?.nombre ?? ""}`} wide>
      <div className="tabs">
        <button className={`tab-btn ${tab === "detalle" ? "active" : ""}`} onClick={() => setTab("detalle")}>
          Detalle
        </button>
        <button className={`tab-btn ${tab === "sub" ? "active" : ""}`} onClick={() => setTab("sub")}>
          Subactividades ({hijos.length})
        </button>
        <button className={`tab-btn ${tab === "evidencias" ? "active" : ""}`} onClick={() => setTab("evidencias")}>
          Evidencias ({evidencias.length})
        </button>
        <button className={`tab-btn ${tab === "comentarios" ? "active" : ""}`} onClick={() => setTab("comentarios")}>
          Comentarios ({comentarios.length})
        </button>
      </div>

      {tab === "detalle" && (
        <div className="stack">
          <div className="flex-gap" style={{ flexWrap: "wrap" }}>
            <EstadoBadge estado={estado} />
            <PrioridadBadge prioridad={a.prioridad} />
            {a.requiereApoyoInterarea && <Badge color="orange">Requiere apoyo interárea</Badge>}
            {solicitudOrigen && <Badge color="purple">Origen: solicitud interárea</Badge>}
          </div>

          {a.descripcion && <p className="small-text" style={{ lineHeight: 1.6 }}>{a.descripcion}</p>}

          <div className="grid-2">
            <div>
              <div className="side-panel-row"><span className="k">Responsable</span><span className="v">{responsable?.nombre}</span></div>
              <div className="side-panel-row"><span className="k">Área</span><span className="v">{nombreArea(db, a.areaResponsableId)}</span></div>
              <div className="side-panel-row"><span className="k">Asignado por</span><span className="v">{nombreUsuario(db, a.creadoPorId)}</span></div>
              <div className="side-panel-row"><span className="k">Fechas</span><span className="v">{formatoFecha(a.fechaInicio)} → {formatoFecha(a.fechaFin)}</span></div>
              <div className="side-panel-row"><span className="k">Indicador / meta</span><span className="v">{a.indicador || "—"} {a.meta && `· ${a.meta}`}</span></div>
              <div className="side-panel-row"><span className="k">Ponderación</span><span className="v">{a.ponderacion}%</span></div>
            </div>
            <div>
              <div className="side-panel-row"><span className="k">Avance esperado</span><span className="v">{Math.round(avanceEsperado)}%</span></div>
              <div className="side-panel-row"><span className="k">Desviación</span><span className="v" style={{ color: desv < -8 ? "var(--red-600)" : "var(--green-600)" }}>{desv > 0 ? "+" : ""}{Math.round(desv)} pts</span></div>
              <div className="side-panel-row"><span className="k">Evidencia esperada</span><span className="v">{a.evidenciaEsperada || "—"}</span></div>
              <div className="side-panel-row"><span className="k">Dependencia</span><span className="v">{a.dependeDeActividadId ? db.actividades.find((d) => d.actividadId === a.dependeDeActividadId)?.nombre : "Ninguna"}</span></div>
              <div className="side-panel-row"><span className="k">Última actualización</span><span className="v">{formatoFecha(a.fechaUltimaActualizacion)}</span></div>
            </div>
          </div>

          <div>
            <div className="flex-between" style={{ marginBottom: 6 }}>
              <b style={{ fontSize: 13 }}>Avance {esHojaNodo ? "" : "(calculado desde subactividades)"}</b>
            </div>
            <ProgressBar value={a.avance} />
            {puedeActualizarAvance && (
              <div className="flex-gap" style={{ marginTop: 10 }}>
                <input type="range" min={0} max={100} value={avanceEdit ?? a.avance} onChange={(e) => setAvanceEdit(Number(e.target.value))} style={{ flex: 1 }} />
                <input type="number" min={0} max={100} style={{ width: 70 }} value={avanceEdit ?? a.avance} onChange={(e) => setAvanceEdit(Number(e.target.value))} />
                <button className="btn btn-primary btn-sm" disabled={avanceEdit === null || avanceEdit === a.avance} onClick={guardarAvance}>
                  Guardar
                </button>
              </div>
            )}
            {!esHojaNodo && <div className="small-text" style={{ marginTop: 6 }}>El avance se recalcula automáticamente cuando cambian sus subactividades.</div>}
          </div>

          {a.bloqueada && (
            <AlertBox tipo="error">
              <b>Bloqueada:</b> {a.motivoBloqueo}
              {(esResponsable || esLiderDeResponsable) && (
                <div style={{ marginTop: 8 }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => store.desbloquear(a!.actividadId, usuarioActual!.usuarioId)}>
                    Liberar bloqueo
                  </button>
                </div>
              )}
            </AlertBox>
          )}

          {mostrarBloqueo && (
            <div className="field">
              <label>Motivo del bloqueo</label>
              <textarea value={motivoBloqueo} onChange={(e) => setMotivoBloqueo(e.target.value)} />
              <div className="flex-gap" style={{ marginTop: 8 }}>
                <button
                  className="btn btn-danger btn-sm"
                  disabled={motivoBloqueo.trim().length < 3}
                  onClick={() => {
                    store.reportarBloqueo(a!.actividadId, motivoBloqueo, usuarioActual!.usuarioId);
                    setMostrarBloqueo(false);
                    setMotivoBloqueo("");
                  }}
                >
                  Confirmar bloqueo
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => setMostrarBloqueo(false)}>
                  Cancelar
                </button>
              </div>
            </div>
          )}

          <div className="flex-gap" style={{ flexWrap: "wrap" }}>
            {puedeReportarBloqueo && !a.bloqueada && !mostrarBloqueo && (
              <button className="btn btn-secondary btn-sm" onClick={() => setMostrarBloqueo(true)}>
                🚫 Reportar bloqueo
              </button>
            )}
            {puedeSolicitarApoyo && (
              <button className="btn btn-secondary btn-sm" onClick={() => setMostrarSolicitud(true)}>
                🔁 Solicitar apoyo a otra área
              </button>
            )}
            {puedeEliminar && (
              <button
                className="btn btn-danger btn-sm"
                onClick={() => {
                  if (store.eliminarActividad(a!.actividadId, usuarioActual!.usuarioId)) onClose();
                }}
              >
                Eliminar
              </button>
            )}
          </div>
        </div>
      )}

      {tab === "sub" && (
        <div>
          <div className="flex-between" style={{ marginBottom: 12 }}>
            <span className="small-text">Divide esta actividad en pasos ejecutables.</span>
            {puedeCrearSub && (
              <button className="btn btn-primary btn-sm" onClick={() => setMostrarSubForm(true)}>
                + Nueva subactividad
              </button>
            )}
          </div>
          {hijos.length === 0 ? (
            <AlertBox tipo="info">Esta actividad todavía no tiene subactividades.</AlertBox>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Subactividad</th>
                    <th>Responsable</th>
                    <th>Fechas</th>
                    <th>Peso</th>
                    <th>Avance</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {hijos.map((h) => (
                    <tr key={h.actividadId} className="clickable" onClick={() => onAbrirActividad?.(h.actividadId)}>
                      <td>{h.nombre}</td>
                      <td>{nombreUsuario(db, h.responsableId)}</td>
                      <td>{formatoFecha(h.fechaInicio)} - {formatoFecha(h.fechaFin)}</td>
                      <td>{h.ponderacion}%</td>
                      <td style={{ minWidth: 120 }}>
                        <ProgressBar value={h.avance} />
                      </td>
                      <td>
                        <EstadoBadge estado={estadoEfectivo(h, db.actividades)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "evidencias" && (
        <div>
          {puedeAgregarEvidencia && (
            <div className="card" style={{ background: "var(--gray-50)", marginBottom: 16 }}>
              <div className="card-title" style={{ marginBottom: 10 }}>Adjuntar evidencia (simulada)</div>
              <div className="form-grid">
                <div className="field">
                  <label>Nombre del archivo</label>
                  <input value={evNombre} onChange={(e) => setEvNombre(e.target.value)} placeholder="reporte_avance.pdf" />
                </div>
                <div className="field">
                  <label>Tipo</label>
                  <select value={evTipo} onChange={(e) => setEvTipo(e.target.value)}>
                    {["Documento", "Hoja de cálculo", "Imagen", "Presentación", "Enlace"].map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div className="field full">
                  <label>Comentario</label>
                  <input value={evComentario} onChange={(e) => setEvComentario(e.target.value)} />
                </div>
              </div>
              <button
                className="btn btn-primary btn-sm"
                disabled={evNombre.trim().length < 3}
                onClick={() => {
                  store.agregarEvidencia(a!.actividadId, { nombreArchivo: evNombre, tipo: evTipo, tamanioKB: Math.round(80 + Math.random() * 900), comentario: evComentario }, usuarioActual!.usuarioId);
                  setEvNombre("");
                  setEvComentario("");
                }}
              >
                Adjuntar
              </button>
            </div>
          )}
          {evidencias.length === 0 ? (
            <AlertBox tipo="info">No hay evidencias registradas para esta actividad.</AlertBox>
          ) : (
            <div className="list-clean">
              {evidencias.map((e) => (
                <div className="list-item-row" key={e.evidenciaId}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13.3 }}>📎 {e.nombreArchivo}</div>
                    <div className="small-text">
                      {e.tipo} · {e.tamanioKB} KB · Subido por {nombreUsuario(db, e.subidoPorId)} el {formatoFecha(e.fecha)}
                    </div>
                    {e.comentario && <div className="small-text" style={{ marginTop: 3 }}>"{e.comentario}"</div>}
                  </div>
                  <div className="flex-gap">
                    {e.validada ? <Badge color="green">Validada</Badge> : <Badge color="yellow">Pendiente</Badge>}
                    {!e.validada && puedeValidarEvidencia && (
                      <button className="btn btn-secondary btn-sm" onClick={() => store.validarEvidencia(e.evidenciaId, usuarioActual!.usuarioId)}>
                        Validar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "comentarios" && (
        <div>
          <div className="field">
            <textarea value={comentarioTexto} onChange={(e) => setComentarioTexto(e.target.value)} placeholder="Escribe un comentario..." />
          </div>
          <button
            className="btn btn-primary btn-sm"
            disabled={comentarioTexto.trim().length < 2}
            onClick={() => {
              store.agregarComentario("Actividad", a!.actividadId, comentarioTexto, usuarioActual!.usuarioId);
              setComentarioTexto("");
            }}
          >
            Comentar
          </button>
          <div className="divider" />
          <div className="list-clean">
            {comentarios.length === 0 && <div className="small-text">Sin comentarios aún.</div>}
            {comentarios.map((c) => (
              <div key={c.comentarioId} className="list-item-row" style={{ alignItems: "flex-start" }}>
                <div>
                  <b style={{ fontSize: 12.8 }}>{nombreUsuario(db, c.autorId)}</b>
                  <div className="small-text">{c.texto}</div>
                </div>
                <span className="small-text">{formatoFechaHora(c.fecha)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {mostrarSubForm && (
        <ActividadFormModal
          open
          onClose={() => setMostrarSubForm(false)}
          proyectoId={a.proyectoId}
          objetivoId={proyecto?.objetivoId ?? ""}
          actividadPadreId={a.actividadId}
          modo="subactividad"
          creadoPorId={usuarioActual.usuarioId}
          areaCreadorId={usuarioActual.areaId}
        />
      )}
      {mostrarSolicitud && <SolicitudApoyoModal open onClose={() => setMostrarSolicitud(false)} actividad={a} solicitanteId={usuarioActual.usuarioId} />}
    </Modal>
  );
}
