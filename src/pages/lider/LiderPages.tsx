import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { Badge, EstadoBadge, PrioridadBadge, ProgressBar, EmptyState, AlertBox, Avatar, formatoFecha } from "../../components/ui";
import { objetivosVisibles, resumenObjetivo, proyectosDeArea, kpisActividades, nombreUsuario } from "../../services/selectors";
import { avanceProyecto, estadoEfectivo, hijosDe, raicesDeProyecto } from "../../services/calc";
import { ProyectoFormModal } from "../../components/ProyectoFormModal";
import { ActividadFormModal } from "../../components/ActividadFormModal";
import { BandejaAprobaciones, ListaMisSolicitudes } from "../../components/SolicitudesUI";
import { GanttView } from "../../components/GanttView";

export function MisObjetivosLider() {
  const { db, usuarioActual } = useApp();
  const [proyectoModalObjetivo, setProyectoModalObjetivo] = useState<string | null>(null);
  if (!usuarioActual) return null;
  const objetivos = objetivosVisibles(db, usuarioActual);

  if (objetivos.length === 0) return <EmptyState icon="🎯" title="Tu área aún no participa en ningún objetivo" sub="Cuando Dirección te asigne un objetivo aparecerá aquí." />;

  return (
    <div className="stack">
      {objetivos.map((o) => {
        const r = resumenObjetivo(db, o.objetivoId);
        const miPonderacion = r?.avance.porArea.find((pa) => pa.areaId === usuarioActual.areaId);
        const misProyectos = proyectosDeArea(db, usuarioActual.areaId, o.objetivoId);
        return (
          <div className="card" key={o.objetivoId}>
            <div className="card-header">
              <div>
                <div className="card-title">{o.nombreCorto}</div>
                <div className="card-sub">{o.descripcion}</div>
              </div>
              <Badge color="blue">Tu ponderación: {miPonderacion?.ponderacion ?? 0}%</Badge>
            </div>
            <div className="grid-2">
              <div>
                <div className="side-panel-row"><span className="k">Indicador</span><span className="v">{o.indicador}</span></div>
                <div className="side-panel-row"><span className="k">Línea base → Meta</span><span className="v">{o.lineaBase} → {o.meta} {o.unidad}</span></div>
                <div className="side-panel-row"><span className="k">Periodo</span><span className="v">{formatoFecha(o.fechaInicio)} → {formatoFecha(o.fechaFin)}</span></div>
                <div className="side-panel-row"><span className="k">Avance de tu área</span><span className="v">{Math.round(miPonderacion?.avance.avance ?? 0)}%</span></div>
              </div>
              <div>
                <div className="small-text" style={{ fontWeight: 700, marginBottom: 6 }}>Tus proyectos derivados</div>
                {misProyectos.length === 0 ? (
                  <div className="small-text">Aún no has creado un proyecto para este objetivo.</div>
                ) : (
                  misProyectos.map((p) => (
                    <div className="side-panel-row" key={p.proyectoId}>
                      <span className="k">{p.nombre}</span>
                      <span className="v">{Math.round(avanceProyecto(p.proyectoId, db.actividades))}%</span>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div style={{ marginTop: 14 }}>
              <button className="btn btn-primary btn-sm" onClick={() => setProyectoModalObjetivo(o.objetivoId)}>
                + Crear proyecto / meta para este objetivo
              </button>
            </div>
          </div>
        );
      })}
      {proyectoModalObjetivo && <ProyectoFormModal open onClose={() => setProyectoModalObjetivo(null)} objetivoId={proyectoModalObjetivo} />}
    </div>
  );
}

export function ProyectosDelArea({ onAbrirProyecto }: { onAbrirProyecto: (id: string) => void }) {
  const { db, usuarioActual } = useApp();
  const [objetivoId, setObjetivoId] = useState<string>("");
  if (!usuarioActual) return null;
  const objetivos = objetivosVisibles(db, usuarioActual);
  const proyectos = proyectosDeArea(db, usuarioActual.areaId).filter((p) => !objetivoId || p.objetivoId === objetivoId);
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="stack">
      <div className="filters-row">
        <select value={objetivoId} onChange={(e) => setObjetivoId(e.target.value)}>
          <option value="">Todos los objetivos</option>
          {objetivos.map((o) => (
            <option key={o.objetivoId} value={o.objetivoId}>{o.nombreCorto}</option>
          ))}
        </select>
        <button className="btn btn-primary" disabled={objetivos.length === 0} onClick={() => setModalOpen(true)}>
          + Nuevo proyecto
        </button>
      </div>
      {proyectos.length === 0 ? (
        <EmptyState icon="📁" title="Sin proyectos todavía" />
      ) : (
        <div className="stack">
          {proyectos.map((p) => {
            const raices = raicesDeProyecto(db.actividades, p.proyectoId);
            const kpis = kpisActividades(db, raices);
            return (
              <div className="card list-item-row" key={p.proyectoId} style={{ cursor: "pointer" }} onClick={() => onAbrirProyecto(p.proyectoId)}>
                <div>
                  <div style={{ fontWeight: 700 }}>{p.nombre}</div>
                  <div className="small-text">{p.descripcion}</div>
                  <div className="small-text" style={{ marginTop: 4 }}>{kpis.actividadesTotales} actividades · {formatoFecha(p.fechaInicio)} → {formatoFecha(p.fechaFin)}</div>
                </div>
                <div style={{ width: 140 }}>
                  <ProgressBar value={avanceProyecto(p.proyectoId, db.actividades)} />
                </div>
              </div>
            );
          })}
        </div>
      )}
      {modalOpen && objetivos[0] && <ProyectoFormModal open onClose={() => setModalOpen(false)} objetivoId={objetivoId || objetivos[0].objetivoId} />}
    </div>
  );
}

export function MiEquipo({ onAbrirActividad }: { onAbrirActividad: (id: string) => void }) {
  const { db, usuarioActual } = useApp();
  if (!usuarioActual) return null;
  const equipo = db.usuarios.filter((u) => usuarioActual.personasACargo.includes(u.usuarioId));

  if (equipo.length === 0) return <EmptyState icon="👥" title="Aún no tienes personas a cargo registradas" />;

  return (
    <div className="stack">
      {equipo.map((persona) => {
        const actividades = db.actividades.filter((a) => a.responsableId === persona.usuarioId);
        const kpis = kpisActividades(db, actividades);
        return (
          <div className="card" key={persona.usuarioId}>
            <div className="flex-gap" style={{ marginBottom: 12 }}>
              <Avatar nombre={persona.nombre} />
              <div>
                <div style={{ fontWeight: 700 }}>{persona.nombre}</div>
                <div className="small-text">{persona.puesto}</div>
              </div>
              <div style={{ marginLeft: "auto" }} className="flex-gap">
                <Badge color="blue">{kpis.actividadesTotales} actividades</Badge>
                {kpis.bloqueadas > 0 && <Badge color="purple">{kpis.bloqueadas} bloqueadas</Badge>}
                {kpis.vencidas > 0 && <Badge color="red">{kpis.vencidas} vencidas</Badge>}
              </div>
            </div>
            {actividades.length === 0 ? (
              <div className="small-text">Sin actividades asignadas.</div>
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead><tr><th>Actividad</th><th>Fechas</th><th>Avance</th><th>Estado</th></tr></thead>
                  <tbody>
                    {actividades.map((a) => (
                      <tr key={a.actividadId} className="clickable" onClick={() => onAbrirActividad(a.actividadId)}>
                        <td>{a.nombre}</td>
                        <td>{formatoFecha(a.fechaInicio)} - {formatoFecha(a.fechaFin)}</td>
                        <td style={{ minWidth: 120 }}><ProgressBar value={a.avance} /></td>
                        <td><EstadoBadge estado={estadoEfectivo(a, db.actividades)} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function ActividadesLider({ onAbrirActividad, proyectoIdInicial }: { onAbrirActividad: (id: string) => void; proyectoIdInicial?: string | null }) {
  const { db, usuarioActual } = useApp();
  const [proyectoId, setProyectoId] = useState<string>(proyectoIdInicial ?? "");
  const [modalOpen, setModalOpen] = useState(false);
  React.useEffect(() => {
    if (proyectoIdInicial) setProyectoId(proyectoIdInicial);
  }, [proyectoIdInicial]);
  if (!usuarioActual) return null;
  const proyectos = proyectosDeArea(db, usuarioActual.areaId);
  const proyectoActivo = proyectoId || proyectos[0]?.proyectoId || "";
  const proyecto = db.proyectos.find((p) => p.proyectoId === proyectoActivo);
  const raices = proyecto ? raicesDeProyecto(db.actividades, proyecto.proyectoId) : [];
  const equipo = db.usuarios.filter((u) => usuarioActual.personasACargo.includes(u.usuarioId)).map((u) => ({ usuarioId: u.usuarioId, nombre: u.nombre }));

  if (proyectos.length === 0) return <EmptyState icon="📋" title="Primero crea un proyecto en 'Proyectos del área'" />;

  return (
    <div className="stack">
      <div className="filters-row">
        <select value={proyectoActivo} onChange={(e) => setProyectoId(e.target.value)}>
          {proyectos.map((p) => (
            <option key={p.proyectoId} value={p.proyectoId}>{p.nombre}</option>
          ))}
        </select>
        <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
          + Nueva actividad
        </button>
      </div>
      {raices.length === 0 ? (
        <EmptyState icon="📋" title="Sin actividades en este proyecto todavía" />
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Actividad</th><th>Responsable</th><th>Fechas</th><th>Peso</th><th>Prioridad</th><th>Avance</th><th>Estado</th></tr></thead>
            <tbody>
              {raices.map((a) => (
                <React.Fragment key={a.actividadId}>
                  <tr className="clickable" onClick={() => onAbrirActividad(a.actividadId)}>
                    <td><b>{a.nombre}</b></td>
                    <td>{nombreUsuario(db, a.responsableId)}</td>
                    <td>{formatoFecha(a.fechaInicio)} - {formatoFecha(a.fechaFin)}</td>
                    <td>{a.ponderacion}%</td>
                    <td><PrioridadBadge prioridad={a.prioridad} /></td>
                    <td style={{ minWidth: 120 }}><ProgressBar value={a.avance} /></td>
                    <td><EstadoBadge estado={estadoEfectivo(a, db.actividades)} /></td>
                  </tr>
                  {hijosDe(db.actividades, a.actividadId).map((h) => (
                    <tr key={h.actividadId} className="clickable" onClick={() => onAbrirActividad(h.actividadId)}>
                      <td style={{ paddingLeft: 28 }}>↳ {h.nombre}</td>
                      <td>{nombreUsuario(db, h.responsableId)}</td>
                      <td>{formatoFecha(h.fechaInicio)} - {formatoFecha(h.fechaFin)}</td>
                      <td>{h.ponderacion}%</td>
                      <td><PrioridadBadge prioridad={h.prioridad} /></td>
                      <td style={{ minWidth: 120 }}><ProgressBar value={h.avance} /></td>
                      <td><EstadoBadge estado={estadoEfectivo(h, db.actividades)} /></td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {modalOpen && proyecto && (
        <ActividadFormModal
          open
          onClose={() => setModalOpen(false)}
          proyectoId={proyecto.proyectoId}
          objetivoId={proyecto.objetivoId}
          actividadPadreId={null}
          modo="actividad"
          creadoPorId={usuarioActual.usuarioId}
          areaCreadorId={usuarioActual.areaId}
          equipo={equipo}
        />
      )}
    </div>
  );
}

export function SolicitudesLider() {
  const { usuarioActual } = useApp();
  if (!usuarioActual) return null;
  return <ListaMisSolicitudes usuarioId={usuarioActual.usuarioId} />;
}

export function AprobacionesLider() {
  const { db, usuarioActual } = useApp();
  if (!usuarioActual) return null;
  const externas = db.actividades.filter((a) => a.origenSolicitudId && usuarioActual.personasACargo.includes(a.responsableId));
  return (
    <div className="stack">
      <BandejaAprobaciones usuarioId={usuarioActual.usuarioId} />
      {externas.length > 0 && (
        <div className="card">
          <div className="card-title" style={{ marginBottom: 10 }}>Actividades externas aceptadas para tu equipo</div>
          <div className="list-clean">
            {externas.map((a) => (
              <div className="list-item-row" key={a.actividadId}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{a.nombre}</div>
                  <div className="small-text">Asignada a {nombreUsuario(db, a.responsableId)} · originada por solicitud interárea</div>
                </div>
                <EstadoBadge estado={estadoEfectivo(a, db.actividades)} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function GanttLider() {
  return <GanttView />;
}

export { AlertBox };
