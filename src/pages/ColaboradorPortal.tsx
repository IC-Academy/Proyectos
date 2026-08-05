import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ListChecks,
  CheckCircle2,
  Clock,
  AlertOctagon,
  Lock,
  LayoutGrid,
  Table2,
  RefreshCcw,
  Paperclip,
  ShieldAlert,
  CalendarClock,
  Share2,
  History,
  ArrowUpRight,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { useAuth } from "../hooks/useAuth";
import { PageHeader } from "../components/common/PageHeader";
import { KpiCard } from "../components/common/KpiCard";
import { Card } from "../components/common/Card";
import { Badge } from "../components/common/Badge";
import { Button } from "../components/common/Button";
import { SemaforoDot } from "../components/common/SemaforoDot";
import { ProgressBar } from "../components/common/ProgressBar";
import { EmptyState } from "../components/common/EmptyState";
import { DataTable, type Columna } from "../components/common/DataTable";
import { HistorialModal } from "../components/common/HistorialModal";
import { ActualizarAvanceModal } from "../components/forms/ActualizarAvanceModal";
import { DelegarActividadModal } from "../components/forms/DelegarActividadModal";
import { ReportarBloqueoModal } from "../components/forms/ReportarBloqueoModal";
import { SolicitarCambioFechaModal } from "../components/forms/SolicitarCambioFechaModal";
import { estatusClases, prioridadClases } from "../utils/badges";
import { semaforoDe, diasRestantesDe } from "../utils/elementHelpers";
import { estaVencido, formatFecha } from "../utils/dates";
import type { Actividad } from "../types";

type Modal = "avance" | "delegar" | "bloqueo" | "fecha" | "historial" | null;

export default function ColaboradorPortal() {
  const { usuario } = useAuth();
  const { actividades, objetivos, getUsuario } = useApp();
  const navigate = useNavigate();
  const [vista, setVista] = useState<"tarjetas" | "tabla">("tarjetas");
  const [filtroEstatus, setFiltroEstatus] = useState("Todos");
  const [modalActivo, setModalActivo] = useState<Modal>(null);
  const [seleccionada, setSeleccionada] = useState<Actividad | null>(null);

  const misActividades = useMemo(
    () => (usuario ? actividades.filter((a) => a.responsableEjecutorId === usuario.id) : []),
    [actividades, usuario]
  );

  const kpis = useMemo(() => {
    const completadas = misActividades.filter((a) => a.estatus === "Completado" || a.estatus === "Cerrado").length;
    const porVencer = misActividades.filter((a) => {
      const d = diasRestantesDe(a);
      return d >= 0 && d <= 10 && a.estatus !== "Completado" && a.estatus !== "Cerrado";
    }).length;
    const vencidas = misActividades.filter((a) => estaVencido(a.fechaFin) && a.estatus !== "Completado" && a.estatus !== "Cerrado").length;
    const bloqueadas = misActividades.filter((a) => a.bloqueada).length;
    return { total: misActividades.length, completadas, porVencer, vencidas, bloqueadas };
  }, [misActividades]);

  const filtradas = useMemo(() => {
    if (filtroEstatus === "Todos") return misActividades;
    return misActividades.filter((a) => a.estatus === filtroEstatus);
  }, [misActividades, filtroEstatus]);

  function abrir(modal: Modal, actividad: Actividad) {
    setSeleccionada(actividad);
    setModalActivo(modal);
  }

  function cerrarModales() {
    setModalActivo(null);
    setSeleccionada(null);
  }

  const columnas: Columna<Actividad>[] = [
    {
      key: "nombre",
      header: "Actividad",
      sortValue: (a) => a.nombre,
      render: (a) => (
        <div className="flex items-center gap-2 min-w-[200px]">
          <SemaforoDot semaforo={semaforoDe(a)} />
          <span className="font-medium text-navy">{a.nombre}</span>
        </div>
      ),
    },
    { key: "objetivo", header: "Contribuye a", render: (a) => objetivos.find((o) => o.id === a.objetivoId)?.nombre ?? "-" },
    { key: "fecha", header: "Fecha compromiso", sortValue: (a) => a.fechaFin, render: (a) => formatFecha(a.fechaFin) },
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
    { key: "prioridad", header: "Prioridad", sortValue: (a) => a.prioridad, render: (a) => <Badge className={prioridadClases[a.prioridad]}>{a.prioridad}</Badge> },
    {
      key: "acciones",
      header: "",
      render: (a) => (
        <Button tamano="sm" variante="secundario" onClick={() => abrir("avance", a)}>
          Actualizar
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader titulo="Mis compromisos" subtitulo={`Actividades bajo tu responsabilidad, ${usuario?.nombre}`} />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <KpiCard titulo="Asignadas" valor={kpis.total} icono={ListChecks} colorIcono="#1F5A94" />
        <KpiCard titulo="Completadas" valor={kpis.completadas} icono={CheckCircle2} colorIcono="#1F9D68" />
        <KpiCard titulo="Por vencer" valor={kpis.porVencer} icono={Clock} colorIcono="#F4B740" />
        <KpiCard titulo="Vencidas" valor={kpis.vencidas} icono={AlertOctagon} colorIcono="#D64545" />
        <KpiCard titulo="Bloqueadas" valor={kpis.bloqueadas} icono={Lock} colorIcono="#D64545" />
      </div>

      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <select value={filtroEstatus} onChange={(e) => setFiltroEstatus(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm">
          <option value="Todos">Todos los estatus</option>
          {["Sin iniciar", "En tiempo", "En riesgo", "Retrasado", "Vencido", "Completado"].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1">
          <button onClick={() => setVista("tarjetas")} className={`p-1.5 rounded-md ${vista === "tarjetas" ? "bg-navy text-white" : "text-slate-400"}`}>
            <LayoutGrid size={15} />
          </button>
          <button onClick={() => setVista("tabla")} className={`p-1.5 rounded-md ${vista === "tabla" ? "bg-navy text-white" : "text-slate-400"}`}>
            <Table2 size={15} />
          </button>
        </div>
      </div>

      {filtradas.length === 0 ? (
        <Card>
          <EmptyState titulo="No tienes actividades con este filtro" icono={ListChecks} />
        </Card>
      ) : vista === "tabla" ? (
        <Card>
          <DataTable columnas={columnas} datos={filtradas} filaKey={(a) => a.id} buscablePor={(a) => a.nombre} />
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtradas.map((a) => {
            const iniciativa = objetivos.find((o) => o.id === a.objetivoId);
            const propietario = getUsuario(a.responsablePropietarioId);
            const dias = diasRestantesDe(a);
            return (
              <Card key={a.id}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-navy text-sm leading-snug">{a.nombre}</p>
                    <p className="text-xs text-slate-400 truncate">Contribuye a: {iniciativa?.nombre ?? "-"}</p>
                  </div>
                  <SemaforoDot semaforo={semaforoDe(a)} />
                </div>

                <div className="flex flex-wrap gap-1.5 mb-3">
                  <Badge className={estatusClases[a.estatus]}>{a.estatus}</Badge>
                  <Badge className={prioridadClases[a.prioridad]}>{a.prioridad}</Badge>
                  {a.bloqueada && <Badge className="bg-red-50 text-danger border border-red-200">Bloqueada</Badge>}
                </div>

                <ProgressBar valor={a.avanceCalculado} mostrarValor />

                <div className="grid grid-cols-2 gap-y-1 gap-x-3 mt-3 text-xs text-slate-500">
                  <span>Propietario: <span className="text-navy">{propietario?.nombre ?? "-"}</span></span>
                  <span>Peso: <span className="text-navy">{a.peso}%</span></span>
                  <span>Fecha compromiso: <span className="text-navy">{formatFecha(a.fechaFin)}</span></span>
                  <span>{dias >= 0 ? `Días restantes: ${dias}` : `Vencida hace ${Math.abs(dias)} d`}</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-2">Última actualización: {formatFecha(a.ultimaActualizacion.slice(0, 10))}</p>

                <div className="grid grid-cols-2 gap-2 mt-4">
                  <Button tamano="sm" onClick={() => abrir("avance", a)}>
                    <RefreshCcw size={13} /> Actualizar avance
                  </Button>
                  <Button tamano="sm" variante="secundario" onClick={() => abrir("historial", a)}>
                    <History size={13} /> Historial
                  </Button>
                  <Button tamano="sm" variante="secundario" onClick={() => abrir("bloqueo", a)}>
                    <ShieldAlert size={13} /> Bloqueo
                  </Button>
                  <Button tamano="sm" variante="secundario" onClick={() => abrir("fecha", a)}>
                    <CalendarClock size={13} /> Cambio fecha
                  </Button>
                  <Button tamano="sm" variante="secundario" onClick={() => abrir("delegar", a)}>
                    <Share2 size={13} /> Delegar
                  </Button>
                  <Button tamano="sm" variante="fantasma" onClick={() => navigate(`/objetivos/${a.objetivoId}`)}>
                    <ArrowUpRight size={13} /> Objetivo superior
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <ActualizarAvanceModal abierto={modalActivo === "avance"} onClose={cerrarModales} actividad={seleccionada} />
      <DelegarActividadModal abierto={modalActivo === "delegar"} onClose={cerrarModales} actividad={seleccionada} />
      <ReportarBloqueoModal abierto={modalActivo === "bloqueo"} onClose={cerrarModales} actividad={seleccionada} />
      <SolicitarCambioFechaModal abierto={modalActivo === "fecha"} onClose={cerrarModales} actividad={seleccionada} />
      <HistorialModal abierto={modalActivo === "historial"} onClose={cerrarModales} elementoId={seleccionada?.id ?? null} titulo={seleccionada?.nombre ?? ""} />
    </div>
  );
}
