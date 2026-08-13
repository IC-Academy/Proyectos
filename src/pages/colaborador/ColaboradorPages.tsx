import React, { useState } from "react";
import { useApp } from "../../context/useApp";
import { KPICard, Badge, EstadoBadge, PrioridadBadge, ProgressBar, EmptyState, AlertBox } from "../../components/ui";
import { formatoFecha } from "../../utils/format";
import { objetivosVisibles, misActividades, kpisActividades, resumenObjetivo, nombreUsuario } from "../../services/selectors";
import { avanceEsperadoPorFecha, estadoEfectivo, hijosDe } from "../../services/calc";
import { CascadaView } from "../../components/CascadaView";
import { ListaMisSolicitudes } from "../../components/SolicitudesUI";

export function MiResumenColaborador({ onAbrirActividad }: { onAbrirActividad: (id: string) => void }) {
  const { db, usuarioActual } = useApp();
  if (!usuarioActual) return null;
  const mias = misActividades(db, usuarioActual.usuarioId);
  const kpis = kpisActividades(db, mias);
  const objetivos = objetivosVisibles(db, usuarioActual);
  const criticas = mias.filter((a) => estadoEfectivo(a, db.actividades) === "Vencida" || estadoEfectivo(a, db.actividades) === "Bloqueada" || estadoEfectivo(a, db.actividades) === "Por vencer");

  return (
    <div className="stack">
      <div className="kpi-grid">
        <KPICard label="Actividades totales" value={kpis.actividadesTotales} accent="blue" />
        <KPICard label="Completadas" value={kpis.completadas} accent="green" />
        <KPICard label="Por vencer" value={kpis.porVencer} accent="yellow" />
        <KPICard label="Vencidas" value={kpis.vencidas} accent="red" />
        <KPICard label="Bloqueadas" value={kpis.bloqueadas} accent="purple" />
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-title" style={{ marginBottom: 12 }}>Objetivos a los que contribuyes</div>
          {objetivos.length === 0 ? (
            <div className="small-text">Aún no tienes actividades ligadas a un objetivo estratégico.</div>
          ) : (
            objetivos.map((o) => {
              const r = resumenObjetivo(db, o.objetivoId);
              return (
                <div key={o.objetivoId} style={{ marginBottom: 14 }}>
                  <div className="flex-between"><b style={{ fontSize: 13 }}>{o.nombreCorto}</b><span className="small-text">{Math.round(r?.avance.avance ?? 0)}%</span></div>
                  <ProgressBar value={r?.avance.avance ?? 0} />
                </div>
              );
            })
          )}
        </div>
        <div className="card">
          <div className="card-title" style={{ marginBottom: 12 }}>Requiere tu atención</div>
          {criticas.length === 0 ? (
            <AlertBox tipo="success">Todo en orden: no tienes actividades vencidas o bloqueadas.</AlertBox>
          ) : (
            <div className="list-clean">
              {criticas.map((a) => (
                <div className="list-item-row" key={a.actividadId} style={{ cursor: "pointer" }} onClick={() => onAbrirActividad(a.actividadId)}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{a.nombre}</div>
                    <div className="small-text">Vence {formatoFecha(a.fechaFin)}</div>
                  </div>
                  <EstadoBadge estado={estadoEfectivo(a, db.actividades)} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function MisObjetivosColaborador() {
  const { db, usuarioActual } = useApp();
  const [objetivoId, setObjetivoId] = useState<string>("");
  if (!usuarioActual) return null;
  const objetivos = objetivosVisibles(db, usuarioActual);
  if (objetivos.length === 0) return <EmptyState icon="🎯" title="Aún no contribuyes a ningún objetivo estratégico" />;
  const activo = objetivoId || objetivos[0].objetivoId;

  return (
    <div className="stack">
      <div className="filters-row">
        <select value={activo} onChange={(e) => setObjetivoId(e.target.value)}>
          {objetivos.map((o) => (
            <option key={o.objetivoId} value={o.objetivoId}>{o.nombreCorto}</option>
          ))}
        </select>
      </div>
      <AlertBox tipo="info">Así contribuyen tus actividades al resultado consolidado de este objetivo estratégico.</AlertBox>
      <CascadaView objetivoId={activo} />
    </div>
  );
}

function TablaActividades({ actividades, onAbrirActividad }: { actividades: ReturnType<typeof misActividades>; onAbrirActividad: (id: string) => void }) {
  const { db } = useApp();
  if (actividades.length === 0) return <EmptyState icon="📋" title="No hay actividades en esta vista" />;
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead><tr><th>Actividad</th><th>Asignado por</th><th>Fechas</th><th>Prioridad</th><th>Avance</th><th>Estado</th></tr></thead>
        <tbody>
          {actividades.map((a) => (
            <tr key={a.actividadId} className="clickable" onClick={() => onAbrirActividad(a.actividadId)}>
              <td><b>{a.nombre}</b></td>
              <td>{nombreUsuario(db, a.creadoPorId)}</td>
              <td>{formatoFecha(a.fechaInicio)} - {formatoFecha(a.fechaFin)}</td>
              <td><PrioridadBadge prioridad={a.prioridad} /></td>
              <td style={{ minWidth: 130 }}><ProgressBar value={a.avance} /></td>
              <td><EstadoBadge estado={estadoEfectivo(a, db.actividades)} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function MisActividadesColaborador({ onAbrirActividad }: { onAbrirActividad: (id: string) => void }) {
  const { db, usuarioActual } = useApp();
  const [filtro, setFiltro] = useState("todas");
  if (!usuarioActual) return null;
  const mias = misActividades(db, usuarioActual.usuarioId);
  const filtradas = mias.filter((a) => filtro === "todas" || estadoEfectivo(a, db.actividades) === filtro);

  return (
    <div className="stack">
      <div className="filters-row">
        {["todas", "En tiempo", "Por vencer", "Vencida", "Bloqueada", "Completada"].map((f) => (
          <button key={f} className={`chip ${filtro === f ? "active" : ""}`} onClick={() => setFiltro(f)}>
            {f === "todas" ? "Todas" : f}
          </button>
        ))}
      </div>
      <TablaActividades actividades={filtradas} onAbrirActividad={onAbrirActividad} />
    </div>
  );
}

export function MiPlanColaborador({ onAbrirActividad }: { onAbrirActividad: (id: string) => void }) {
  const { db, usuarioActual } = useApp();
  if (!usuarioActual) return null;
  const asignadas = misActividades(db, usuarioActual.usuarioId).filter((a) => a.actividadPadreId === null);

  if (asignadas.length === 0) return <EmptyState icon="🗂️" title="No tienes actividades asignadas directamente" sub="Tu líder aún no te ha asignado una actividad." />;

  return (
    <div className="stack">
      <AlertBox tipo="info">Divide cada actividad asignada en subactividades para planear y dar seguimiento a tu trabajo.</AlertBox>
      {asignadas.map((a) => {
        const hijos = hijosDe(db.actividades, a.actividadId);
        const esperado = avanceEsperadoPorFecha(a.fechaInicio, a.fechaFin);
        return (
          <div className="card" key={a.actividadId}>
            <div className="card-header" style={{ cursor: "pointer" }} onClick={() => onAbrirActividad(a.actividadId)}>
              <div>
                <div className="card-title">{a.nombre}</div>
                <div className="card-sub">{formatoFecha(a.fechaInicio)} → {formatoFecha(a.fechaFin)} · Peso {a.ponderacion}%</div>
              </div>
              <EstadoBadge estado={estadoEfectivo(a, db.actividades)} />
            </div>
            <div className="flex-gap" style={{ marginBottom: 10 }}>
              <div style={{ flex: 1 }}>
                <div className="small-text">Avance real {a.avance}% · esperado {Math.round(esperado)}%</div>
                <ProgressBar value={a.avance} />
              </div>
            </div>
            {hijos.length === 0 ? (
              <div className="small-text">Sin subactividades. Ábrela para crear el desglose de trabajo.</div>
            ) : (
              <div className="list-clean">
                {hijos.map((h) => (
                  <div key={h.actividadId} className="list-item-row" style={{ cursor: "pointer" }} onClick={(e) => { e.stopPropagation(); onAbrirActividad(h.actividadId); }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{h.nombre}</div>
                      <div className="small-text">Peso {h.ponderacion}% {h.bloqueada && "· 🚫 bloqueada"}</div>
                    </div>
                    <div className="flex-gap">
                      <div style={{ width: 100 }}><ProgressBar value={h.avance} /></div>
                      <EstadoBadge estado={estadoEfectivo(h, db.actividades)} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function EvidenciasColaborador({ onAbrirActividad }: { onAbrirActividad: (id: string) => void }) {
  const { db, usuarioActual } = useApp();
  if (!usuarioActual) return null;
  const mias = misActividades(db, usuarioActual.usuarioId).map((a) => a.actividadId);
  const evidencias = db.evidencias.filter((e) => mias.includes(e.actividadId) || e.subidoPorId === usuarioActual.usuarioId);

  if (evidencias.length === 0) return <EmptyState icon="📎" title="No has adjuntado evidencias" sub="Ábrelas desde el detalle de cada actividad." />;

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead><tr><th>Archivo</th><th>Actividad</th><th>Fecha</th><th>Estado</th></tr></thead>
        <tbody>
          {evidencias.map((e) => {
            const act = db.actividades.find((a) => a.actividadId === e.actividadId);
            return (
              <tr key={e.evidenciaId} className="clickable" onClick={() => onAbrirActividad(e.actividadId)}>
                <td>📎 {e.nombreArchivo}</td>
                <td>{act?.nombre}</td>
                <td>{formatoFecha(e.fecha)}</td>
                <td>{e.validada ? <Badge color="green">Validada</Badge> : <Badge color="yellow">Pendiente</Badge>}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function SolicitudesColaborador() {
  const { usuarioActual } = useApp();
  if (!usuarioActual) return null;
  return <ListaMisSolicitudes usuarioId={usuarioActual.usuarioId} />;
}
