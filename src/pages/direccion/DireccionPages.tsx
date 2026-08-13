import React, { useState } from "react";
import { useApp } from "../../context/useApp";
import { KPICard, Badge, EstadoBadge, ProgressBar, AlertBox, EmptyState } from "../../components/ui";
import { formatoFecha } from "../../utils/format";
import { resumenObjetivo, nombreArea, nombreUsuario } from "../../services/selectors";
import { detectarCuellosDeBotella } from "../../services/bottleneck";
import { CascadaView } from "../../components/CascadaView";
import { GanttView } from "../../components/GanttView";
import { SmartWizardModal } from "../../components/SmartWizardModal";

function SelectorObjetivo({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { db } = useApp();
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      {db.objetivos.map((o) => (
        <option key={o.objetivoId} value={o.objetivoId}>
          {o.nombreCorto}
        </option>
      ))}
    </select>
  );
}

export function ResumenEjecutivo({ onAbrirActividad }: { onAbrirActividad: (id: string) => void }) {
  const { db } = useApp();
  const [objetivoId, setObjetivoId] = useState(db.objetivos[0]?.objetivoId ?? "");
  if (db.objetivos.length === 0) return <EmptyState icon="🎯" title="Aún no hay objetivos estratégicos" sub="Crea el primero desde el menú Objetivos estratégicos." />;
  const r = resumenObjetivo(db, objetivoId);
  if (!r) return null;

  const riesgo = r.desviacion <= -20 || r.kpis.bloqueadas > 0 ? "alto" : r.desviacion <= -8 ? "medio" : "bajo";
  const riesgoColor = riesgo === "alto" ? "red" : riesgo === "medio" ? "yellow" : "green";

  return (
    <div className="stack">
      <div className="filters-row">
        <SelectorObjetivo value={objetivoId} onChange={setObjetivoId} />
        <Badge color={riesgoColor as never}>Riesgo general: {riesgo}</Badge>
        <span className="small-text">Última actualización: {formatoFecha(new Date().toISOString().slice(0, 10))}</span>
      </div>

      <div className="kpi-grid">
        <KPICard label="Avance total" value={`${Math.round(r.avance.avance)}%`} accent="blue" />
        <KPICard label="Avance esperado" value={`${Math.round(r.avanceEsperado)}%`} />
        <KPICard label="Desviación" value={`${r.desviacion > 0 ? "+" : ""}${Math.round(r.desviacion)} pts`} accent={r.desviacion < -8 ? "red" : "green"} />
        <KPICard label="Cumplimiento vs. meta" value={`${Math.round((r.objetivo.lineaBase + ((r.objetivo.meta - r.objetivo.lineaBase) * r.avance.avance) / 100) )} / ${r.objetivo.meta} ${r.objetivo.unidad}`} />
        <KPICard label="Días restantes" value={r.diasRestantes} accent={r.diasRestantes < 30 ? "yellow" : undefined} />
        <KPICard label="Áreas responsables" value={r.avance.porArea.length} />
      </div>

      <div className="kpi-grid">
        <KPICard label="Actividades totales" value={r.kpis.actividadesTotales} />
        <KPICard label="Terminadas" value={r.kpis.completadas} accent="green" />
        <KPICard label="En tiempo" value={r.kpis.enTiempo} accent="blue" />
        <KPICard label="Por vencer" value={r.kpis.porVencer} accent="yellow" />
        <KPICard label="Vencidas" value={r.kpis.vencidas} accent="red" />
        <KPICard label="Bloqueadas" value={r.kpis.bloqueadas} accent="purple" />
        <KPICard label="Solicitudes pendientes" value={r.solicitudesPendientes} />
        <KPICard label="Evidencias pendientes" value={r.evidenciasPendientes} />
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-title" style={{ marginBottom: 14 }}>Avance real vs. esperado por área</div>
          {r.avance.porArea.map((pa) => (
            <div key={pa.areaId} style={{ marginBottom: 14 }}>
              <div className="flex-between" style={{ marginBottom: 4 }}>
                <b style={{ fontSize: 13 }}>{nombreArea(db, pa.areaId)}</b>
                <span className="small-text">Ponderación {pa.ponderacion}%</span>
              </div>
              <ProgressBar value={pa.avance.avance} />
              <div className="small-text">Esperado: {Math.round(r.avanceEsperado)}% {pa.avance.advertencia && <span style={{ color: "var(--red-600)" }}> · Ponderación de proyectos del área no suma 100% ({pa.avance.sumaPonderacion}%)</span>}</div>
            </div>
          ))}
          {r.avance.advertenciaPonderacionAreas && <AlertBox tipo="warn">Las ponderaciones de las áreas de este objetivo suman {r.avance.sumaPonderacionAreas}%, deberían sumar 100%.</AlertBox>}
        </div>
        <div className="stack">
          <div className="card">
            <div className="card-title" style={{ marginBottom: 10 }}>Carga y rezago</div>
            <div className="side-panel-row"><span className="k">Área con mayor carga</span><span className="v">{r.areaMayorCarga ? `${nombreArea(db, r.areaMayorCarga.areaId)} (${r.areaMayorCarga.total})` : "—"}</span></div>
            <div className="side-panel-row"><span className="k">Área más rezagada</span><span className="v">{r.areaMasRezagada ? `${nombreArea(db, r.areaMasRezagada.areaId)} (${Math.round(r.areaMasRezagada.avance)}%)` : "—"}</span></div>
            <div className="side-panel-row"><span className="k">Línea base / Meta</span><span className="v">{r.objetivo.lineaBase} → {r.objetivo.meta} {r.objetivo.unidad}</span></div>
          </div>
          <div className="card">
            <div className="card-title" style={{ marginBottom: 10 }}>🔍 Actividades críticas (cuello de botella)</div>
            {r.cuellos.length === 0 ? (
              <div className="small-text">Sin cuellos de botella relevantes detectados.</div>
            ) : (
              <div className="list-clean">
                {r.cuellos.slice(0, 5).map((c) => (
                  <div key={c.id} className="list-item-row clickable" style={{ cursor: c.tipo === "Actividad" ? "pointer" : "default" }} onClick={() => c.tipo === "Actividad" && onAbrirActividad(c.id)}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 12.8 }}>{c.nombre}</div>
                      <div className="small-text">{c.responsable} · {c.razones[0]}</div>
                    </div>
                    <Badge color="red">{c.score} pts</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title" style={{ marginBottom: 14 }}>Gantt resumido</div>
        <GanttView objetivoIdFijo={objetivoId} />
      </div>

      <div className="card">
        <div className="card-title" style={{ marginBottom: 14 }}>Vista de cascada</div>
        <CascadaView objetivoId={objetivoId} />
      </div>
    </div>
  );
}

export function ObjetivosEstrategicos() {
  const { db } = useApp();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [seleccionado, setSeleccionado] = useState<string | null>(null);

  return (
    <div className="stack">
      <div className="flex-between">
        <span className="small-text">{db.objetivos.length} objetivo(s) estratégico(s) registrados.</span>
        <button className="btn btn-primary" onClick={() => setWizardOpen(true)}>
          + Nuevo objetivo (asistente SMART)
        </button>
      </div>

      {db.objetivos.length === 0 && <EmptyState icon="🎯" title="Sin objetivos aún" sub="Usa el asistente SMART para crear el primero." />}

      <div className="stack">
        {db.objetivos.map((o) => {
          const r = resumenObjetivo(db, o.objetivoId);
          const abierto = seleccionado === o.objetivoId;
          return (
            <div className="card" key={o.objetivoId}>
              <div className="card-header" style={{ cursor: "pointer" }} onClick={() => setSeleccionado(abierto ? null : o.objetivoId)}>
                <div>
                  <div className="card-title">{o.nombreCorto}</div>
                  <div className="card-sub">{o.indicador}: {o.lineaBase} → {o.meta} {o.unidad} · {o.anioFiscal}</div>
                </div>
                <div className="flex-gap">
                  <Badge color="blue">SMART {o.smartScore}</Badge>
                  <Badge color={r && r.desviacion < -8 ? "red" : "green"}>{r ? `${Math.round(r.avance.avance)}% avance` : ""}</Badge>
                </div>
              </div>
              {abierto && r && (
                <div style={{ marginTop: 14 }}>
                  <p className="small-text" style={{ marginBottom: 12 }}>{o.descripcion}</p>
                  <div className="grid-2">
                    <div>
                      <div className="side-panel-row"><span className="k">Relevancia estratégica</span><span className="v" style={{ textAlign: "left" }}>{o.relevanciaEstrategica}</span></div>
                      <div className="side-panel-row"><span className="k">Evidencia esperada</span><span className="v" style={{ textAlign: "left" }}>{o.evidenciaEsperada}</span></div>
                      <div className="side-panel-row"><span className="k">Riesgos iniciales</span><span className="v" style={{ textAlign: "left" }}>{o.riesgosIniciales}</span></div>
                      <div className="side-panel-row"><span className="k">Periodo</span><span className="v">{formatoFecha(o.fechaInicio)} → {formatoFecha(o.fechaFin)}</span></div>
                    </div>
                    <div>
                      <div className="small-text" style={{ marginBottom: 6, fontWeight: 700 }}>Áreas y ponderación</div>
                      {r.avance.porArea.map((pa) => (
                        <div key={pa.areaId} className="side-panel-row">
                          <span className="k">{nombreArea(db, pa.areaId)}</span>
                          <span className="v">{pa.ponderacion}% · {Math.round(pa.avance.avance)}% avance</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <SmartWizardModal open={wizardOpen} onClose={() => setWizardOpen(false)} />
    </div>
  );
}

export function CascadaPage() {
  const { db } = useApp();
  const [objetivoId, setObjetivoId] = useState(db.objetivos[0]?.objetivoId ?? "");
  if (db.objetivos.length === 0) return <EmptyState icon="🌊" title="Sin objetivos para mostrar en cascada" />;
  return (
    <div className="stack">
      <div className="filters-row">
        <SelectorObjetivo value={objetivoId} onChange={setObjetivoId} />
      </div>
      <CascadaView objetivoId={objetivoId} />
    </div>
  );
}

export function GanttPage() {
  return <GanttView />;
}

export function AlertasPage({ onAbrirActividad }: { onAbrirActividad: (id: string) => void }) {
  const { db } = useApp();
  const todasAlertas = db.objetivos.flatMap((o) => detectarCuellosDeBotella(o.objetivoId, db).map((c) => ({ ...c, objetivoNombre: o.nombreCorto })));
  const solicitudesPend = db.solicitudes.filter((s) => s.estatus.startsWith("Pendiente") || s.estatus === "Cambios solicitados");

  return (
    <div className="stack">
      <div className="card">
        <div className="card-title" style={{ marginBottom: 12 }}>🚨 Cuellos de botella detectados en toda la organización</div>
        {todasAlertas.length === 0 ? (
          <AlertBox tipo="success">No se detectan cuellos de botella relevantes en este momento.</AlertBox>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>Elemento</th><th>Objetivo</th><th>Responsable</th><th>Razones</th><th>Score</th></tr>
              </thead>
              <tbody>
                {todasAlertas.sort((a, b) => b.score - a.score).map((c) => (
                  <tr key={c.id} className={c.tipo === "Actividad" ? "clickable" : ""} onClick={() => c.tipo === "Actividad" && onAbrirActividad(c.id)}>
                    <td><b>{c.nombre}</b></td>
                    <td>{c.objetivoNombre}</td>
                    <td>{c.responsable}</td>
                    <td className="small-text">{c.razones.join(" ")}</td>
                    <td><Badge color="red">{c.score}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div className="card">
        <div className="card-title" style={{ marginBottom: 12 }}>Solicitudes interárea pendientes</div>
        {solicitudesPend.length === 0 ? (
          <div className="small-text">No hay solicitudes pendientes.</div>
        ) : (
          <div className="list-clean">
            {solicitudesPend.map((s) => (
              <div className="list-item-row" key={s.solicitudId}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{nombreUsuario(db, s.solicitanteId)} → {nombreUsuario(db, s.personaRequeridaId)}</div>
                  <div className="small-text">{s.descripcionActividad}</div>
                </div>
                <EstadoBadge estado={s.estatus} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function EvidenciasDireccionPage({ onAbrirActividad }: { onAbrirActividad: (id: string) => void }) {
  const { db, store, usuarioActual } = useApp();
  const [filtro, setFiltro] = useState<"todas" | "pendientes" | "validadas">("pendientes");
  const filtradas = db.evidencias.filter((e) => (filtro === "todas" ? true : filtro === "pendientes" ? !e.validada : e.validada));

  return (
    <div className="stack">
      <div className="filters-row">
        {(["pendientes", "validadas", "todas"] as const).map((f) => (
          <button key={f} className={`chip ${filtro === f ? "active" : ""}`} onClick={() => setFiltro(f)}>
            {f === "pendientes" ? "Pendientes" : f === "validadas" ? "Validadas" : "Todas"}
          </button>
        ))}
      </div>
      {filtradas.length === 0 ? (
        <EmptyState icon="📎" title="No hay evidencias en este filtro" />
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Archivo</th><th>Actividad</th><th>Subido por</th><th>Fecha</th><th>Estado</th><th></th></tr></thead>
            <tbody>
              {filtradas.map((e) => {
                const act = db.actividades.find((a) => a.actividadId === e.actividadId);
                return (
                  <tr key={e.evidenciaId}>
                    <td>📎 {e.nombreArchivo}</td>
                    <td className="clickable" style={{ color: "var(--blue-600)", cursor: "pointer" }} onClick={() => onAbrirActividad(e.actividadId)}>
                      {act?.nombre ?? "—"}
                    </td>
                    <td>{nombreUsuario(db, e.subidoPorId)}</td>
                    <td>{formatoFecha(e.fecha)}</td>
                    <td>{e.validada ? <Badge color="green">Validada</Badge> : <Badge color="yellow">Pendiente</Badge>}</td>
                    <td>
                      {!e.validada && (
                        <button className="btn btn-secondary btn-sm" onClick={() => store.validarEvidencia(e.evidenciaId, usuarioActual!.usuarioId)}>
                          Validar
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
