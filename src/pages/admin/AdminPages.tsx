import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { KPICard, Badge, EstadoBadge, ProgressBar, AlertBox, Modal, EmptyState, formatoFecha, formatoFechaHora, Avatar } from "../../components/ui";
import { kpisActividades, misActividades, nombreArea, nombreUsuario } from "../../services/selectors";
import { estadoEfectivo } from "../../services/calc";
import { BandejaAprobaciones } from "../../components/SolicitudesUI";
import type { RolUsuario, Usuario } from "../../types";

export function ResumenAdmin({ onAbrirActividad }: { onAbrirActividad: (id: string) => void }) {
  const { db, usuarioActual } = useApp();
  if (!usuarioActual) return null;
  const kpis = kpisActividades(db, db.actividades);
  const solicitudesPendientes = db.solicitudes.filter((s) => s.estatus.startsWith("Pendiente") || s.estatus === "Cambios solicitados").length;
  const misTareas = misActividades(db, usuarioActual.usuarioId);

  return (
    <div className="stack">
      <div className="kpi-grid">
        <KPICard label="Usuarios activos" value={db.usuarios.filter((u) => u.activo).length} accent="blue" />
        <KPICard label="Objetivos estratégicos" value={db.objetivos.length} />
        <KPICard label="Proyectos activos" value={db.proyectos.length} />
        <KPICard label="Actividades totales" value={kpis.actividadesTotales} />
        <KPICard label="Vencidas" value={kpis.vencidas} accent="red" />
        <KPICard label="Bloqueadas" value={kpis.bloqueadas} accent="purple" />
        <KPICard label="Solicitudes pendientes" value={solicitudesPendientes} accent="yellow" />
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Objetivos y avance por área</div>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Objetivo</th><th>Áreas</th><th>Año fiscal</th><th>SMART</th><th>Estatus</th></tr></thead>
            <tbody>
              {db.objetivos.map((o) => (
                <tr key={o.objetivoId}>
                  <td><b>{o.nombreCorto}</b></td>
                  <td>{db.objetivoAreas.filter((oa) => oa.objetivoId === o.objetivoId).map((oa) => nombreArea(db, oa.areaId)).join(", ")}</td>
                  <td>{o.anioFiscal}</td>
                  <td><Badge color="blue">{o.smartScore}</Badge></td>
                  <td><Badge color="green">{o.estatus}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="card-title" style={{ marginBottom: 10 }}>Mis actividades asignadas</div>
        <p className="small-text" style={{ marginBottom: 10 }}>
          Como administrador de la plataforma también puedes tener actividades propias (por ejemplo, apoyo interárea aprobado).
        </p>
        {misTareas.length === 0 ? (
          <div className="small-text">No tienes actividades asignadas por el momento.</div>
        ) : (
          <div className="list-clean">
            {misTareas.map((a) => (
              <div key={a.actividadId} className="list-item-row" style={{ cursor: "pointer" }} onClick={() => onAbrirActividad(a.actividadId)}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{a.nombre}</div>
                  <div className="small-text">{formatoFecha(a.fechaInicio)} → {formatoFecha(a.fechaFin)}</div>
                </div>
                <div className="flex-gap">
                  <div style={{ width: 100 }}><ProgressBar value={a.avance} /></div>
                  <EstadoBadge estado={estadoEfectivo(a, db.actividades)} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function UsuarioFormModal({ open, onClose, editar }: { open: boolean; onClose: () => void; editar: Usuario | null }) {
  const { db, store, usuarioActual } = useApp();
  const [nombre, setNombre] = useState(editar?.nombre ?? "");
  const [correo, setCorreo] = useState(editar?.correo ?? "");
  const [rol, setRol] = useState<RolUsuario>(editar?.rol ?? "Colaborador");
  const [areaId, setAreaId] = useState(editar?.areaId ?? db.areas[0]?.areaId ?? "");
  const [puesto, setPuesto] = useState(editar?.puesto ?? "");
  const [liderId, setLiderId] = useState(editar?.liderId ?? "");
  const [activo, setActivo] = useState(editar?.activo ?? true);

  if (!usuarioActual) return null;
  const puedeGuardar = nombre.trim().length > 2 && correo.includes("@") && areaId;

  function guardar() {
    const lider = db.usuarios.find((u) => u.usuarioId === liderId);
    if (editar) {
      store.actualizarUsuario(editar.usuarioId, { nombre, correo, rol, areaId, puesto, liderId: liderId || null, nombreLider: lider?.nombre ?? null, activo }, usuarioActual!.usuarioId);
    } else {
      store.crearUsuario(
        {
          empleadoId: `EMP-${Math.floor(100 + Math.random() * 900)}`,
          nombre,
          correo,
          passwordDemo: "1234",
          rol,
          areaId,
          puesto,
          liderId: liderId || null,
          nombreLider: lider?.nombre ?? null,
          activo,
          personasACargo: [],
          permisos: [],
        },
        usuarioActual!.usuarioId
      );
    }
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editar ? "Editar usuario" : "Nuevo usuario simulado"}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" disabled={!puedeGuardar} onClick={guardar}>Guardar</button>
        </>
      }
    >
      <div className="form-grid">
        <div className="field full"><label>Nombre completo</label><input value={nombre} onChange={(e) => setNombre(e.target.value)} /></div>
        <div className="field full"><label>Correo</label><input value={correo} onChange={(e) => setCorreo(e.target.value)} /></div>
        <div className="field"><label>Rol</label>
          <select value={rol} onChange={(e) => setRol(e.target.value as RolUsuario)}>
            {["Administrador", "Direccion", "Lider", "Colaborador"].map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div className="field"><label>Área</label>
          <select value={areaId} onChange={(e) => setAreaId(e.target.value)}>
            {db.areas.map((a) => <option key={a.areaId} value={a.areaId}>{a.nombre}</option>)}
          </select>
        </div>
        <div className="field full"><label>Puesto</label><input value={puesto} onChange={(e) => setPuesto(e.target.value)} /></div>
        <div className="field full"><label>Líder</label>
          <select value={liderId} onChange={(e) => setLiderId(e.target.value)}>
            <option value="">Sin líder (nivel superior)</option>
            {db.usuarios.filter((u) => u.usuarioId !== editar?.usuarioId).map((u) => <option key={u.usuarioId} value={u.usuarioId}>{u.nombre}</option>)}
          </select>
        </div>
        <div className="field"><label className="checkbox-row" style={{ marginTop: 10 }}><input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} /> Usuario activo</label></div>
      </div>
    </Modal>
  );
}

export function UsuariosAdmin() {
  const { db } = useApp();
  const [editar, setEditar] = useState<Usuario | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="stack">
      <div className="flex-between">
        <span className="small-text">{db.usuarios.length} usuario(s) registrados en la demo.</span>
        <button className="btn btn-primary" onClick={() => { setEditar(null); setModalOpen(true); }}>+ Nuevo usuario</button>
      </div>
      <div className="table-wrap">
        <table className="data-table">
          <thead><tr><th>Usuario</th><th>Correo</th><th>Rol</th><th>Área</th><th>Puesto</th><th>Líder</th><th>Estatus</th><th></th></tr></thead>
          <tbody>
            {db.usuarios.map((u) => (
              <tr key={u.usuarioId}>
                <td className="flex-gap"><Avatar nombre={u.nombre} size="sm" /> {u.nombre}</td>
                <td>{u.correo}</td>
                <td><Badge color="blue">{u.rol}</Badge></td>
                <td>{nombreArea(db, u.areaId)}</td>
                <td>{u.puesto}</td>
                <td>{u.nombreLider ?? "—"}</td>
                <td>{u.activo ? <Badge color="green">Activo</Badge> : <Badge color="gray">Inactivo</Badge>}</td>
                <td><button className="btn btn-secondary btn-sm" onClick={() => { setEditar(u); setModalOpen(true); }}>Editar</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modalOpen && <UsuarioFormModal open onClose={() => setModalOpen(false)} editar={editar} />}
    </div>
  );
}

export function AreasAdmin() {
  const { db, store, usuarioActual } = useApp();
  const [editArea, setEditArea] = useState<string | null>(null);
  const [borrador, setBorrador] = useState({ descripcion: "", liderId: "" });

  return (
    <div className="stack">
      {db.areas.map((a) => {
        const gente = db.usuarios.filter((u) => u.areaId === a.areaId);
        const enEdicion = editArea === a.areaId;
        return (
          <div className="card" key={a.areaId}>
            <div className="card-header">
              <div className="flex-gap">
                <span style={{ width: 14, height: 14, borderRadius: 4, background: a.colorHex, display: "inline-block" }} />
                <div>
                  <div className="card-title">{a.nombre}</div>
                  <div className="card-sub">{gente.length} persona(s) · Líder: {a.liderId ? nombreUsuario(db, a.liderId) : "Sin asignar"}</div>
                </div>
              </div>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setEditArea(enEdicion ? null : a.areaId);
                  setBorrador({ descripcion: a.descripcion, liderId: a.liderId ?? "" });
                }}
              >
                {enEdicion ? "Cerrar" : "Editar"}
              </button>
            </div>
            {enEdicion ? (
              <div>
                <div className="field"><label>Descripción</label><textarea value={borrador.descripcion} onChange={(e) => setBorrador((b) => ({ ...b, descripcion: e.target.value }))} /></div>
                <div className="field"><label>Líder del área</label>
                  <select value={borrador.liderId} onChange={(e) => setBorrador((b) => ({ ...b, liderId: e.target.value }))}>
                    <option value="">Sin asignar</option>
                    {gente.map((u) => <option key={u.usuarioId} value={u.usuarioId}>{u.nombre}</option>)}
                  </select>
                </div>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    store.actualizarArea(a.areaId, { descripcion: borrador.descripcion, liderId: borrador.liderId || null }, usuarioActual!.usuarioId);
                    setEditArea(null);
                  }}
                >
                  Guardar
                </button>
              </div>
            ) : (
              <p className="small-text">{a.descripcion}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function PeriodosAdmin() {
  const { db, store, usuarioActual } = useApp();
  const [nombre, setNombre] = useState("");
  const [anioFiscal, setAnioFiscal] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");

  return (
    <div className="stack">
      <div className="table-wrap">
        <table className="data-table">
          <thead><tr><th>Periodo</th><th>Año fiscal</th><th>Fechas</th><th>Estatus</th><th></th></tr></thead>
          <tbody>
            {db.periodos.map((p) => (
              <tr key={p.periodoId}>
                <td>{p.nombre}</td>
                <td>{p.anioFiscal}</td>
                <td>{formatoFecha(p.fechaInicio)} → {formatoFecha(p.fechaFin)}</td>
                <td>{p.activo ? <Badge color="green">Activo</Badge> : <Badge color="gray">Cerrado</Badge>}</td>
                <td>
                  <button className="btn btn-secondary btn-sm" onClick={() => store.actualizarPeriodo(p.periodoId, { activo: !p.activo }, usuarioActual!.usuarioId)}>
                    {p.activo ? "Cerrar" : "Reactivar"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="card">
        <div className="card-title" style={{ marginBottom: 12 }}>Crear nuevo periodo</div>
        <div className="form-grid">
          <div className="field full"><label>Nombre</label><input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Año Fiscal 2026-2027" /></div>
          <div className="field"><label>Año fiscal</label><input value={anioFiscal} onChange={(e) => setAnioFiscal(e.target.value)} placeholder="2026-2027" /></div>
          <div className="field"><label>Fecha inicial</label><input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} /></div>
          <div className="field"><label>Fecha final</label><input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} /></div>
        </div>
        <button
          className="btn btn-primary btn-sm"
          disabled={!nombre || !anioFiscal || !fechaInicio || !fechaFin}
          onClick={() => {
            store.crearPeriodo({ nombre, anioFiscal, fechaInicio, fechaFin, activo: true }, usuarioActual!.usuarioId);
            setNombre(""); setAnioFiscal(""); setFechaInicio(""); setFechaFin("");
          }}
        >
          Crear periodo
        </button>
      </div>
    </div>
  );
}

export function ConfiguracionAdmin() {
  const { store, usuarioActual } = useApp();
  const [confirmando, setConfirmando] = useState(false);

  return (
    <div className="stack">
      <div className="card">
        <div className="card-title" style={{ marginBottom: 8 }}>Catálogos</div>
        <p className="small-text">Áreas, periodos y roles se administran desde sus respectivas secciones del menú.</p>
      </div>
      <div className="card">
        <div className="card-title" style={{ marginBottom: 8 }}>Integraciones externas</div>
        <p className="small-text" style={{ marginBottom: 10 }}>Esta versión funciona 100% local. Las siguientes integraciones se habilitarán en la fase productiva:</p>
        <div className="pill-list">
          {["Entra ID (SSO)", "Airtable", "n8n", "Supabase", "API de Evaluación de Desempeño"].map((s) => (
            <span className="coming-soon" key={s}>🔒 {s}</span>
          ))}
        </div>
      </div>
      <div className="card" style={{ borderColor: "var(--red-100)" }}>
        <div className="card-title" style={{ marginBottom: 8, color: "var(--red-600)" }}>Zona de riesgo</div>
        <p className="small-text" style={{ marginBottom: 12 }}>Restablece todos los datos de la demo a su estado inicial. Esta acción no se puede deshacer.</p>
        {!confirmando ? (
          <button className="btn btn-danger btn-sm" onClick={() => setConfirmando(true)}>Restablecer datos de demostración</button>
        ) : (
          <div className="flex-gap">
            <AlertBox tipo="warn">¿Confirmas que deseas borrar todos los cambios y regenerar los datos precargados?</AlertBox>
            <button
              className="btn btn-danger btn-sm"
              onClick={() => {
                store.restablecerDemo(usuarioActual!.usuarioId);
                setConfirmando(false);
              }}
            >
              Sí, restablecer
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => setConfirmando(false)}>Cancelar</button>
          </div>
        )}
      </div>
    </div>
  );
}

export function AprobacionesAdmin() {
  const { db, usuarioActual } = useApp();
  if (!usuarioActual) return null;
  return (
    <div className="stack">
      <BandejaAprobaciones usuarioId={usuarioActual.usuarioId} />
      <div className="card">
        <div className="card-title" style={{ marginBottom: 10 }}>Todas las solicitudes del sistema</div>
        {db.solicitudes.length === 0 ? (
          <EmptyState icon="🔁" title="Sin solicitudes registradas" />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Solicitante</th><th>Persona requerida</th><th>Descripción</th><th>Estatus</th></tr></thead>
              <tbody>
                {db.solicitudes.map((s) => (
                  <tr key={s.solicitudId}>
                    <td>{nombreUsuario(db, s.solicitanteId)}</td>
                    <td>{nombreUsuario(db, s.personaRequeridaId)}</td>
                    <td>{s.descripcionActividad}</td>
                    <td><EstadoBadge estado={s.estatus} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export function BitacoraAdmin() {
  const { db } = useApp();
  const [usuarioFiltro, setUsuarioFiltro] = useState("");
  const filtrada = db.bitacora.filter((b) => !usuarioFiltro || b.usuarioId === usuarioFiltro);

  return (
    <div className="stack">
      <div className="filters-row">
        <select value={usuarioFiltro} onChange={(e) => setUsuarioFiltro(e.target.value)}>
          <option value="">Todos los usuarios</option>
          {db.usuarios.map((u) => <option key={u.usuarioId} value={u.usuarioId}>{u.nombre}</option>)}
        </select>
      </div>
      <div className="table-wrap">
        <table className="data-table">
          <thead><tr><th>Fecha</th><th>Usuario</th><th>Acción</th><th>Entidad</th><th>Detalle</th></tr></thead>
          <tbody>
            {filtrada.map((b) => (
              <tr key={b.bitacoraId}>
                <td>{formatoFechaHora(b.fecha)}</td>
                <td>{nombreUsuario(db, b.usuarioId)}</td>
                <td>{b.accion}</td>
                <td>{b.entidadTipo}</td>
                <td className="small-text">{b.detalle}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function IntegracionEddAdmin() {
  const { db, store, usuarioActual } = useApp();
  const relevantes = db.actividades.filter((a) => a.avance > 0);

  return (
    <div className="stack">
      <AlertBox tipo="info">
        Vista de compatibilidad con la Evaluación de Desempeño (EDD). No existe ninguna conexión externa: esta pantalla simula cómo se
        transferirían los proyectos y actividades activos hacia el siguiente ciclo de EDD.
      </AlertBox>
      <div className="card">
        <div className="card-title" style={{ marginBottom: 10 }}>Reglas del ciclo {db.configuracionEdd.cicloActivo}</div>
        <div className="side-panel-row"><span className="k">Apertura de ciclo</span><span className="v">{formatoFecha(db.configuracionEdd.fechaAperturaCiclo)}</span></div>
        <div className="side-panel-row"><span className="k">Cierre de ciclo</span><span className="v">{formatoFecha(db.configuracionEdd.fechaCierreCiclo)}</span></div>
        <div className="side-panel-row"><span className="k">Tope de ponderación por empleado</span><span className="v">{db.configuracionEdd.topePonderacionPorEmpleado}%</span></div>
        <ul style={{ marginTop: 10 }}>
          {db.configuracionEdd.reglas.map((r, i) => (
            <li key={i} className="small-text" style={{ listStyle: "disc", marginLeft: 18, marginBottom: 4 }}>{r}</li>
          ))}
        </ul>
      </div>
      <div className="card">
        <div className="card-title" style={{ marginBottom: 10 }}>Proyectos/actividades que se transferirían al ciclo EDD</div>
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Actividad</th><th>Empleado</th><th>Avance</th><th>Estatus EDD</th><th></th></tr></thead>
            <tbody>
              {relevantes.map((a) => (
                <tr key={a.actividadId}>
                  <td>{a.nombre}</td>
                  <td>{nombreUsuario(db, a.responsableId)}</td>
                  <td style={{ minWidth: 110 }}><ProgressBar value={a.avance} /></td>
                  <td><Badge color={a.edd.estatusIntegracionEdd === "Disponible para EDD" ? "green" : "gray"}>{a.edd.estatusIntegracionEdd}</Badge></td>
                  <td>
                    {a.edd.estatusIntegracionEdd !== "Disponible para EDD" && (
                      <button className="btn btn-secondary btn-sm" onClick={() => store.validarAvanceEddLider(a.actividadId, a.avance, "Avance calculado por el portal, sin ajustes.", usuarioActual!.usuarioId)}>
                        Marcar disponible (simulado)
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
