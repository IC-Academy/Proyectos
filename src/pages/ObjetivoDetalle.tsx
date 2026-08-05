import React, { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Plus,
  AlertTriangle,
  CalendarClock,
  ArrowLeft,
  Users,
  History as HistoryIcon,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { useAuth } from "../hooks/useAuth";
import { PageHeader } from "../components/common/PageHeader";
import { Card } from "../components/common/Card";
import { Badge } from "../components/common/Badge";
import { Button } from "../components/common/Button";
import { KpiCard } from "../components/common/KpiCard";
import { ProgressBar } from "../components/common/ProgressBar";
import { SemaforoDot } from "../components/common/SemaforoDot";
import { EmptyState } from "../components/common/EmptyState";
import { DataTable, type Columna } from "../components/common/DataTable";
import { HistorialTimeline } from "../components/common/HistorialTimeline";
import { HistorialModal } from "../components/common/HistorialModal";
import { EvidenciasList } from "../components/common/EvidenciasList";
import { GanttChart, type FilaGantt } from "../components/common/GanttChart";
import { CascadaNode, construirNodo, flattenNodo, type NodoCascada } from "../components/common/CascadaNode";
import { CrearObjetivoHijoModal } from "../components/forms/CrearObjetivoHijoModal";
import { CrearActividadModal } from "../components/forms/CrearActividadModal";
import { SolicitarCambioObjetivoModal } from "../components/forms/SolicitarCambioObjetivoModal";
import { estatusClases, prioridadClases, riesgoClases, bloqueoEstatusClases, urgenciaClases, solicitudClases } from "../utils/badges";
import { semaforoDe, esperadoDe, desviacionDe, diasRestantesDe } from "../utils/elementHelpers";
import { formatFecha } from "../utils/dates";
import { formatMoneda } from "../utils/format";
import type { Objetivo, Actividad } from "../types";

const TABS = ["Resumen", "Cascada", "Actividades", "Gantt", "Evidencias", "Riesgos", "Historial"] as const;
type Tab = (typeof TABS)[number];

export default function ObjetivoDetalle() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const { objetivos, actividades, bloqueos, solicitudesCambio, advertenciasPeso, getUsuario } = useApp();
  const [tab, setTab] = useState<Tab>("Resumen");
  const [nodoSeleccionado, setNodoSeleccionado] = useState<NodoCascada | null>(null);
  const [modalHijoObjetivo, setModalHijoObjetivo] = useState(false);
  const [modalHijoActividad, setModalHijoActividad] = useState<{ objetivo: Objetivo | null; actividad: Actividad | null } | null>(null);
  const [modalCambio, setModalCambio] = useState(false);
  const [historialActivo, setHistorialActivo] = useState<{ id: string; nombre: string } | null>(null);

  const objetivo = objetivos.find((o) => o.id === id);

  const migas = useMemo(() => {
    if (!objetivo) return [];
    const cadena: Objetivo[] = [];
    let actual: Objetivo | undefined = objetivo;
    while (actual) {
      cadena.unshift(actual);
      actual = actual.parentId ? objetivos.find((o) => o.id === actual!.parentId) : undefined;
    }
    return cadena;
  }, [objetivo, objetivos]);

  const nodoRaiz = useMemo(() => (objetivo ? construirNodo(objetivos, actividades, "objetivo", objetivo) : null), [objetivo, objetivos, actividades]);
  const descendientes = useMemo(() => (nodoRaiz ? flattenNodo(nodoRaiz) : { objetivos: [], actividades: [] }), [nodoRaiz]);

  if (!objetivo || !nodoRaiz) {
    return (
      <Card>
        <EmptyState titulo="Objetivo no encontrado" mensaje="Es posible que el elemento haya sido eliminado o el enlace sea incorrecto." />
        <div className="text-center mt-3">
          <Button variante="secundario" onClick={() => navigate(-1)}>
            <ArrowLeft size={14} /> Regresar
          </Button>
        </div>
      </Card>
    );
  }

  const responsable = getUsuario(objetivo.responsableId);
  const puedeGestionar = usuario?.rol === "Lider" && objetivo.responsableId === usuario.id;
  const advertenciaPropia = advertenciasPeso.find((w) => w.elementoId === objetivo.id);

  const actividadesDescendientes = descendientes.actividades;
  const bloqueosRelacionados = bloqueos.filter((b) => actividadesDescendientes.some((a) => a.id === b.actividadId));
  const solicitudesRelacionadas = solicitudesCambio.filter(
    (s) => s.elementoId === objetivo.id || descendientes.objetivos.some((o) => o.id === s.elementoId) || actividadesDescendientes.some((a) => a.id === s.elementoId)
  );

  const columnasActividades: Columna<Actividad>[] = [
    {
      key: "nombre",
      header: "Actividad",
      sortValue: (a) => a.nombre,
      render: (a) => (
        <div className="flex items-center gap-2">
          <SemaforoDot semaforo={semaforoDe(a)} />
          <span className="font-medium text-navy">{a.nombre}</span>
          {a.nivel === 5 && <Badge className="bg-slate-100 text-slate-500 border border-slate-200">Subactividad</Badge>}
        </div>
      ),
    },
    { key: "responsable", header: "Responsable ejecutor", sortValue: (a) => getUsuario(a.responsableEjecutorId)?.nombre ?? "", render: (a) => getUsuario(a.responsableEjecutorId)?.nombre ?? "-" },
    { key: "fecha", header: "Fecha fin", sortValue: (a) => a.fechaFin, render: (a) => formatFecha(a.fechaFin) },
    { key: "peso", header: "Peso", sortValue: (a) => a.peso, render: (a) => `${a.peso}%` },
    {
      key: "avance",
      header: "Avance",
      sortValue: (a) => a.avanceCalculado,
      render: (a) => (
        <div className="w-28">
          <ProgressBar valor={a.avanceCalculado} mostrarValor />
        </div>
      ),
    },
    { key: "estatus", header: "Estatus", sortValue: (a) => a.estatus, render: (a) => <Badge className={estatusClases[a.estatus]}>{a.estatus}</Badge> },
    {
      key: "accion",
      header: "",
      render: (a) => (
        <Button tamano="sm" variante="secundario" onClick={() => setHistorialActivo({ id: a.id, nombre: a.nombre })}>
          <HistoryIcon size={13} /> Historial
        </Button>
      ),
    },
  ];

  const ganttFilas: FilaGantt[] = useMemo(() => {
    const raiz: FilaGantt = {
      id: objetivo.id,
      nombre: objetivo.nombre,
      nivel: objetivo.nivel,
      fechaInicio: objetivo.fechaInicio,
      fechaFin: objetivo.fechaFin,
      avance: objetivo.avanceCalculado,
      estatus: objetivo.estatus,
      responsable: getUsuario(objetivo.responsableId)?.nombre,
      semaforo: semaforoDe(objetivo),
    };
    const hijosObjetivos: FilaGantt[] = descendientes.objetivos.map((o) => ({
      id: o.id,
      nombre: o.nombre,
      nivel: o.nivel,
      fechaInicio: o.fechaInicio,
      fechaFin: o.fechaFin,
      avance: o.avanceCalculado,
      estatus: o.estatus,
      responsable: getUsuario(o.responsableId)?.nombre,
      semaforo: semaforoDe(o),
    }));
    const hijosActividades: FilaGantt[] = actividadesDescendientes.map((a) => ({
      id: a.id,
      nombre: a.nombre,
      nivel: a.nivel,
      fechaInicio: a.fechaInicio,
      fechaFin: a.fechaFin,
      avance: a.avanceCalculado,
      estatus: a.estatus,
      responsable: getUsuario(a.responsableEjecutorId)?.nombre,
      semaforo: semaforoDe(a),
    }));
    return [raiz, ...hijosObjetivos, ...hijosActividades];
  }, [objetivo, descendientes, actividadesDescendientes, getUsuario]);

  function abrirCrearHijo() {
    if (!objetivo) return;
    if (objetivo.nivel === 1 || objetivo.nivel === 2) {
      setModalHijoObjetivo(true);
    } else {
      setModalHijoActividad({ objetivo, actividad: null });
    }
  }

  function abrirCrearHijoDeNodo(nodo: NodoCascada) {
    if (nodo.tipo === "objetivo") {
      const o = nodo.elemento as Objetivo;
      if (o.nivel === 3) setModalHijoActividad({ objetivo: o, actividad: null });
      else setModalHijoObjetivo(true);
    } else {
      setModalHijoActividad({ objetivo: null, actividad: nodo.elemento as Actividad });
    }
  }

  return (
    <div>
      <PageHeader
        titulo={objetivo.nombre}
        migas={[{ label: "Objetivos", to: "/objetivos" }, ...migas.map((m, i) => ({ label: m.nombre, to: i < migas.length - 1 ? `/objetivos/${m.id}` : undefined }))]}
        acciones={
          <>
            <Button variante="secundario" onClick={() => setModalCambio(true)}>
              <CalendarClock size={14} /> Solicitar cambio
            </Button>
            {puedeGestionar && (
              <Button onClick={abrirCrearHijo}>
                <Plus size={14} /> Agregar {objetivo.nivel === 3 ? "actividad" : objetivo.nivel === 1 ? "objetivo de área" : "iniciativa"}
              </Button>
            )}
          </>
        }
      />

      {advertenciaPropia && (
        <div className="mb-4 flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-4 py-3 text-sm">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          Los pesos de los elementos hijos de este objetivo suman {advertenciaPropia.sumaPesos}%, no 100%. Revisa la distribución de pesos para que el avance
          consolidado sea preciso.
        </div>
      )}

      <div className="flex gap-1 mb-5 border-b border-slate-200 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3.5 py-2 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
              tab === t ? "border-brand-blue text-brand-blue" : "border-transparent text-slate-500 hover:text-navy"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Resumen" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard titulo="Avance real" valor={`${Math.round(objetivo.avanceCalculado)}%`} />
            <KpiCard titulo="Avance esperado" valor={`${Math.round(esperadoDe(objetivo))}%`} />
            <KpiCard titulo="Desviación" valor={`${desviacionDe(objetivo)} pts`} tendencia={desviacionDe(objetivo) < 0 ? "down" : "up"} />
            <KpiCard titulo="Días restantes" valor={diasRestantesDe(objetivo)} />
          </div>

          <Card title="Detalle del objetivo">
            <div className="grid md:grid-cols-2 gap-x-8 gap-y-3 text-sm">
              <p className="text-slate-500 md:col-span-2">{objetivo.descripcion}</p>
              <p><span className="text-slate-400">Responsable: </span>{responsable?.nombre} · {responsable?.puesto}</p>
              <p><span className="text-slate-400">Área: </span>{objetivo.area}</p>
              <p><span className="text-slate-400">Prioridad: </span><Badge className={prioridadClases[objetivo.prioridad]}>{objetivo.prioridad}</Badge></p>
              <p><span className="text-slate-400">Riesgo: </span><Badge className={riesgoClases[objetivo.riesgo]}>{objetivo.riesgo}</Badge></p>
              <p><span className="text-slate-400">Indicador: </span>{objetivo.indicador}</p>
              <p><span className="text-slate-400">Valor base → Meta: </span>{formatMoneda(objetivo.valorBase, objetivo.unidad)} → {formatMoneda(objetivo.meta, objetivo.unidad)}</p>
              <p><span className="text-slate-400">Fecha inicio: </span>{formatFecha(objetivo.fechaInicio)}</p>
              <p><span className="text-slate-400">Fecha fin: </span>{formatFecha(objetivo.fechaFin)}</p>
              <p><span className="text-slate-400">Peso dentro de su nivel: </span>{objetivo.peso}%</p>
              <p className="flex items-center gap-2"><span className="text-slate-400">Semáforo: </span><SemaforoDot semaforo={semaforoDe(objetivo)} conEtiqueta /></p>
              {objetivo.criterioExito && <p className="md:col-span-2"><span className="text-slate-400">Criterio de éxito: </span>{objetivo.criterioExito}</p>}
            </div>
            <div className="mt-4">
              <ProgressBar valor={objetivo.avanceCalculado} esperado={esperadoDe(objetivo)} alto mostrarValor />
            </div>
          </Card>

          <Card title="Participantes">
            {objetivo.participantesIds.length === 0 ? (
              <EmptyState titulo="Sin participantes registrados" icono={Users} />
            ) : (
              <div className="flex flex-wrap gap-2">
                {objetivo.participantesIds.map((pid) => {
                  const p = getUsuario(pid);
                  if (!p) return null;
                  return (
                    <span key={pid} className="flex items-center gap-1.5 bg-surface rounded-full pl-1 pr-3 py-1 text-xs">
                      <span className="h-6 w-6 rounded-full bg-brand-light text-brand-blue flex items-center justify-center text-[10px] font-semibold">{p.avatar}</span>
                      {p.nombre}
                    </span>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      )}

      {tab === "Cascada" && (
        <div className="grid lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <CascadaNode nodo={nodoRaiz} onSeleccionar={setNodoSeleccionado} seleccionadoId={nodoSeleccionado?.elemento.id} />
          </Card>
          <Card title="Detalle del elemento seleccionado">
            {!nodoSeleccionado ? (
              <EmptyState titulo="Selecciona un elemento del árbol" mensaje="Haz clic en cualquier nodo para ver su detalle aquí." />
            ) : (
              <div className="space-y-3 text-sm">
                <p className="font-semibold text-navy">{nodoSeleccionado.elemento.nombre}</p>
                <div className="flex items-center gap-2">
                  <SemaforoDot semaforo={semaforoDe(nodoSeleccionado.elemento as any)} conEtiqueta />
                  <Badge className={estatusClases[nodoSeleccionado.elemento.estatus]}>{nodoSeleccionado.elemento.estatus}</Badge>
                </div>
                <ProgressBar valor={(nodoSeleccionado.elemento as any).avanceCalculado} esperado={esperadoDe(nodoSeleccionado.elemento as any)} mostrarValor />
                <p className="text-xs text-slate-500">
                  Responsable:{" "}
                  {getUsuario(
                    nodoSeleccionado.tipo === "objetivo" ? (nodoSeleccionado.elemento as Objetivo).responsableId : (nodoSeleccionado.elemento as Actividad).responsableEjecutorId
                  )?.nombre ?? "-"}
                </p>
                <p className="text-xs text-slate-500">Peso: {nodoSeleccionado.elemento.peso}% · Fecha fin: {formatFecha(nodoSeleccionado.elemento.fechaFin)}</p>
                <p className="text-xs text-slate-500">Elementos hijos: {nodoSeleccionado.hijos.length}</p>
                <div className="flex gap-2 pt-2">
                  <Button tamano="sm" variante="secundario" onClick={() => setHistorialActivo({ id: nodoSeleccionado.elemento.id, nombre: nodoSeleccionado.elemento.nombre })}>
                    <HistoryIcon size={13} /> Historial
                  </Button>
                  {puedeGestionar && (
                    <Button tamano="sm" onClick={() => abrirCrearHijoDeNodo(nodoSeleccionado)}>
                      <Plus size={13} /> Agregar hijo
                    </Button>
                  )}
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {tab === "Actividades" && (
        <Card>
          <DataTable columnas={columnasActividades} datos={actividadesDescendientes} filaKey={(a) => a.id} buscablePor={(a) => a.nombre} vacioTitulo="Sin actividades registradas todavía" />
        </Card>
      )}

      {tab === "Gantt" && (
        <Card>
          <GanttChart filas={ganttFilas} />
        </Card>
      )}

      {tab === "Evidencias" && (
        <Card>
          {actividadesDescendientes.length === 0 ? (
            <EmptyState titulo="Este objetivo aún no tiene actividades con evidencias" />
          ) : (
            <div className="space-y-5">
              {actividadesDescendientes.map((a) => (
                <div key={a.id}>
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-1">{a.nombre}</p>
                  <EvidenciasList actividadId={a.id} />
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {tab === "Riesgos" && (
        <div className="space-y-4">
          <Card title="Nivel de riesgo del objetivo">
            <Badge className={riesgoClases[objetivo.riesgo]}>{objetivo.riesgo}</Badge>
          </Card>
          <Card title="Bloqueos relacionados">
            {bloqueosRelacionados.length === 0 ? (
              <EmptyState titulo="Sin bloqueos activos en esta cascada" />
            ) : (
              <ul className="divide-y divide-slate-100">
                {bloqueosRelacionados.map((b) => (
                  <li key={b.id} className="py-3">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Badge className={bloqueoEstatusClases[b.estatus]}>{b.estatus}</Badge>
                      <Badge className={urgenciaClases[b.urgencia]}>{b.urgencia}</Badge>
                      <span className="text-xs text-slate-400">{b.tipo}</span>
                    </div>
                    <p className="text-sm text-navy font-medium">{actividades.find((a) => a.id === b.actividadId)?.nombre}</p>
                    <p className="text-xs text-slate-500">{b.descripcion}</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card title="Solicitudes de cambio">
            {solicitudesRelacionadas.length === 0 ? (
              <EmptyState titulo="Sin solicitudes de cambio registradas" />
            ) : (
              <ul className="divide-y divide-slate-100">
                {solicitudesRelacionadas.map((s) => (
                  <li key={s.id} className="py-3">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Badge className={solicitudClases[s.estatus]}>{s.estatus}</Badge>
                      <span className="text-xs text-slate-400">{s.tipo}</span>
                    </div>
                    <p className="text-xs text-slate-500">{s.valorAnterior} → {s.valorSolicitado}</p>
                    <p className="text-xs text-slate-500 italic">"{s.motivo}"</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}

      {tab === "Historial" && (
        <Card>
          <HistorialTimeline elementoId={objetivo.id} />
        </Card>
      )}

      <CrearObjetivoHijoModal abierto={modalHijoObjetivo} onClose={() => setModalHijoObjetivo(false)} padre={objetivo} />
      <CrearActividadModal
        abierto={!!modalHijoActividad}
        onClose={() => setModalHijoActividad(null)}
        padreObjetivo={modalHijoActividad?.objetivo ?? null}
        padreActividad={modalHijoActividad?.actividad ?? null}
      />
      <SolicitarCambioObjetivoModal abierto={modalCambio} onClose={() => setModalCambio(false)} objetivo={objetivo} />
      <HistorialModal abierto={!!historialActivo} onClose={() => setHistorialActivo(null)} elementoId={historialActivo?.id ?? null} titulo={historialActivo?.nombre ?? ""} />
    </div>
  );
}
