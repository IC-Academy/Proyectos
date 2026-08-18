import { useMemo, useState } from "react";
import { useApp } from "../../context/useApp";
import { Modal } from "../../components/ui";
import type { NodoCascada, TipoNodoCascada } from "../../types";

const hoy = () => new Date().toISOString().slice(0, 10);
const fin = () => `${new Date().getFullYear()}-12-31`;

export function CascadaOrganizacional() {
  const { db, usuarioActual, store } = useApp();
  const [padre, setPadre] = useState<NodoCascada | null>(null);
  const [corporativo, setCorporativo] = useState(false);
  const [comentarios, setComentarios] = useState<Record<string, string>>({});
  if (!usuarioActual) return null;

  const pendientes = db.nodosCascada.filter((n) => n.padreId === null && n.estatus === "Pendiente Dirección");
  const raices = db.nodosCascada.filter((n) => n.padreId === null);
  const reportes = db.usuarios.filter((u) => u.activo && u.liderId === usuarioActual.usuarioId);
  const puedeProponer = usuarioActual.rol === "Direccion" || Boolean(usuarioActual.esSuperUsuario);
  const visibles = usuarioActual.rol === "Direccion" || usuarioActual.permisos.includes("ver_cascada_completa")
    ? raices
    : raices.filter((r) => db.nodosCascada.some((n) => n.raizId === r.nodoId && n.responsableId === usuarioActual.usuarioId));

  return <>
    <div className="grid-3" style={{ marginBottom: 18 }}>
      <Dato valor={String(visibles.filter((n) => n.estatus !== "Rechazado").length)} etiqueta="Objetivos corporativos" />
      <Dato valor={String(pendientes.length)} etiqueta="Pendientes de Dirección" tono={pendientes.length ? "#b45309" : undefined} />
      <Dato valor={String(reportes.length)} etiqueta="Reportes directos" />
    </div>

    <div className="card" style={{ marginBottom: 18, background: "linear-gradient(120deg,#071a35,#123b68)", color: "white" }}>
      <div className="card-header" style={{ marginBottom: 8 }}>
        <div><div style={{ fontWeight: 800, fontSize: 18 }}>La jerarquía manda; el rol acompaña</div><div style={{ opacity: .78, marginTop: 5, fontSize: 13 }}>Cualquier persona con reportes directos puede desplegar el trabajo al siguiente nivel. Dirección aprueba únicamente el origen corporativo.</div></div>
        {puedeProponer && <button className="btn btn-primary" onClick={() => setCorporativo(true)}>+ Proponer objetivo</button>}
      </div>
    </div>

    {usuarioActual.rol === "Direccion" && pendientes.length > 0 && <div className="card" style={{ marginBottom: 18, borderColor: "#f59e0b" }}>
      <div className="card-title" style={{ marginBottom: 12 }}>Bandeja de aprobación corporativa</div>
      {pendientes.map((n) => <div key={n.nodoId} style={{ padding: "12px 0", borderTop: "1px solid var(--gray-200)" }}>
        <b>{n.titulo}</b> <span className="badge badge-warning">Pendiente Dirección</span>
        <div className="card-sub" style={{ margin: "5px 0 10px" }}>{n.descripcion} · Propuesto por {nombre(db.usuarios, n.creadoPorId)}</div>
        <label>Comentario de Dirección<textarea value={comentarios[n.nodoId] ?? ""} onChange={(e) => setComentarios({ ...comentarios, [n.nodoId]: e.target.value })} /></label>
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button className="btn btn-primary btn-sm" onClick={() => store.decidirObjetivoCorporativo(n.nodoId, "Aprobado", comentarios[n.nodoId] ?? "Aprobado por Dirección.", usuarioActual.usuarioId)}>Aprobar</button>
          <button className="btn btn-secondary btn-sm" onClick={() => store.decidirObjetivoCorporativo(n.nodoId, "Cambios solicitados", comentarios[n.nodoId] || "Favor de ajustar la propuesta.", usuarioActual.usuarioId)}>Pedir cambios</button>
          <button className="btn btn-danger btn-sm" onClick={() => store.decidirObjetivoCorporativo(n.nodoId, "Rechazado", comentarios[n.nodoId] || "No procede.", usuarioActual.usuarioId)}>Rechazar</button>
        </div>
      </div>)}
    </div>}

    <div style={{ display: "grid", gap: 14 }}>
      {visibles.map((r) => <Rama key={r.nodoId} nodo={r} todos={db.nodosCascada} usuarios={db.usuarios} actualId={usuarioActual.usuarioId} onAsignar={setPadre} onAvance={(id, avance) => store.actualizarAvanceNodo(id, avance, usuarioActual.usuarioId)} />)}
      {visibles.length === 0 && <div className="empty-state"><b>Aún no tienes compromisos en la cascada.</b><p>Cuando tu responsable directo te asigne uno, aparecerá aquí.</p></div>}
    </div>

    {corporativo && <Formulario titulo="Proponer objetivo corporativo" responsables={db.usuarios.filter((u) => u.activo)} tipos={["Objetivo"]} onClose={() => setCorporativo(false)} onGuardar={(d) => { store.proponerObjetivoCorporativo(d, usuarioActual.usuarioId); setCorporativo(false); }} />}
    {padre && <Formulario titulo={`Desplegar desde: ${padre.titulo}`} responsables={reportes} tipos={["Objetivo", "Proyecto", "Actividad"]} onClose={() => setPadre(null)} onGuardar={(d) => { store.asignarNodoCascada(padre.nodoId, d, usuarioActual.usuarioId); setPadre(null); }} />}
  </>;
}

function Rama({ nodo, todos, usuarios, actualId, onAsignar, onAvance }: { nodo: NodoCascada; todos: NodoCascada[]; usuarios: { usuarioId: string; nombre: string }[]; actualId: string; onAsignar: (n: NodoCascada) => void; onAvance: (id: string, avance: number) => void }) {
  const hijos = todos.filter((n) => n.padreId === nodo.nodoId);
  const puedeAsignar = nodo.responsableId === actualId && nodo.estatus !== "Pendiente Dirección" && nodo.estatus !== "Rechazado";
  const esHoja = hijos.length === 0;
  return <div className="card" style={{ marginLeft: Math.min(nodo.nivel, 4) * 22, borderLeft: `5px solid ${color(nodo.tipo)}` }}>
    <div className="card-header">
      <div><div className="card-title">{nodo.titulo}</div><div className="card-sub">{nodo.tipo} · {nombre(usuarios, nodo.responsableId)} · nivel {nodo.nivel}</div></div>
      <span className={`badge ${nodo.estatus === "Pendiente Dirección" ? "badge-warning" : nodo.estatus === "Rechazado" ? "badge-danger" : "badge-success"}`}>{nodo.estatus}</span>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 18, alignItems: "center" }}>
      <div><div style={{ height: 10, background: "var(--gray-100)", borderRadius: 20, overflow: "hidden" }}><div style={{ width: `${nodo.avance}%`, height: "100%", background: nodo.avance >= 80 ? "#16a34a" : nodo.avance >= 50 ? "#f59e0b" : "#dc2626" }} /></div><div className="card-sub" style={{ marginTop: 6 }}>{nodo.indicador}: {nodo.lineaBase} → {nodo.meta} {nodo.unidad} · peso {nodo.ponderacion}%</div></div>
      <b style={{ fontSize: 22 }}>{nodo.avance}%</b>
    </div>
    <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
      {puedeAsignar && <button className="btn btn-primary btn-sm" onClick={() => onAsignar(nodo)}>Asignar al siguiente nivel</button>}
      {nodo.responsableId === actualId && esHoja && <input aria-label={`Avance ${nodo.titulo}`} type="number" min="0" max="100" value={nodo.avance} onChange={(e) => onAvance(nodo.nodoId, Number(e.target.value))} style={{ width: 90 }} />}
    </div>
    {hijos.length > 0 && <div style={{ display: "grid", gap: 10, marginTop: 12 }}>{hijos.map((h) => <Rama key={h.nodoId} nodo={h} todos={todos} usuarios={usuarios} actualId={actualId} onAsignar={onAsignar} onAvance={onAvance} />)}</div>}
  </div>;
}

function Formulario({ titulo, responsables, tipos, onClose, onGuardar }: { titulo: string; responsables: { usuarioId: string; nombre: string }[]; tipos: TipoNodoCascada[]; onClose: () => void; onGuardar: (d: Pick<NodoCascada, "tipo" | "titulo" | "descripcion" | "indicador" | "lineaBase" | "meta" | "unidad" | "fechaInicio" | "fechaFin" | "ponderacion" | "responsableId">) => void }) {
  const inicial = useMemo(() => ({ tipo: tipos[0], titulo: "", descripcion: "", indicador: "", lineaBase: 0, meta: 100, unidad: "%", fechaInicio: hoy(), fechaFin: fin(), ponderacion: 100, responsableId: responsables[0]?.usuarioId ?? "" }), [responsables, tipos]);
  const [f, setF] = useState(inicial);
  const ok = f.titulo.trim() && f.descripcion.trim() && f.indicador.trim() && f.responsableId && f.fechaFin >= f.fechaInicio;
  return <Modal open title={titulo} sub="Resultado medible, responsable explícito y fechas claras." onClose={onClose} footer={<><button className="btn btn-secondary" onClick={onClose}>Cancelar</button><button className="btn btn-primary" disabled={!ok} onClick={() => onGuardar(f)}>Guardar y asignar</button></>}>
    <div className="form-grid">
      <label>Tipo<select value={f.tipo} onChange={(e) => setF({ ...f, tipo: e.target.value as TipoNodoCascada })}>{tipos.map((t) => <option key={t}>{t}</option>)}</select></label>
      <label>Responsable<select value={f.responsableId} onChange={(e) => setF({ ...f, responsableId: e.target.value })}>{responsables.map((r) => <option key={r.usuarioId} value={r.usuarioId}>{r.nombre}</option>)}</select></label>
      <label className="full">Nombre<input value={f.titulo} onChange={(e) => setF({ ...f, titulo: e.target.value })} /></label>
      <label className="full">Resultado esperado<textarea value={f.descripcion} onChange={(e) => setF({ ...f, descripcion: e.target.value })} /></label>
      <label>Indicador<input value={f.indicador} onChange={(e) => setF({ ...f, indicador: e.target.value })} /></label><label>Unidad<input value={f.unidad} onChange={(e) => setF({ ...f, unidad: e.target.value })} /></label>
      <label>Línea base<input type="number" value={f.lineaBase} onChange={(e) => setF({ ...f, lineaBase: Number(e.target.value) })} /></label><label>Meta<input type="number" value={f.meta} onChange={(e) => setF({ ...f, meta: Number(e.target.value) })} /></label>
      <label>Inicio<input type="date" value={f.fechaInicio} onChange={(e) => setF({ ...f, fechaInicio: e.target.value })} /></label><label>Fin<input type="date" value={f.fechaFin} onChange={(e) => setF({ ...f, fechaFin: e.target.value })} /></label>
      <label>Ponderación<input type="number" min="1" max="100" value={f.ponderacion} onChange={(e) => setF({ ...f, ponderacion: Number(e.target.value) })} /></label>
    </div>
  </Modal>;
}

function Dato({ valor, etiqueta, tono }: { valor: string; etiqueta: string; tono?: string }) { return <div className="card"><div style={{ fontSize: 28, fontWeight: 800, color: tono ?? "var(--blue-600)" }}>{valor}</div><div className="card-sub">{etiqueta}</div></div>; }
function nombre(usuarios: { usuarioId: string; nombre: string }[], id: string) { return usuarios.find((u) => u.usuarioId === id)?.nombre ?? "Sin responsable"; }
function color(tipo: TipoNodoCascada) { return tipo === "Objetivo" ? "#2563eb" : tipo === "Proyecto" ? "#7c3aed" : "#16a34a"; }
