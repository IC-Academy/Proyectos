import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer } from "recharts";
import { Target, TrendingUp, AlertOctagon, Lock, Users2, ClipboardCheck, Eye, ArrowRight } from "lucide-react";
import { useApp } from "../context/AppContext";
import { useAuth } from "../hooks/useAuth";
import { PageHeader } from "../components/common/PageHeader";
import { KpiCard } from "../components/common/KpiCard";
import { Card } from "../components/common/Card";
import { Badge } from "../components/common/Badge";
import { Button } from "../components/common/Button";
import { SemaforoDot } from "../components/common/SemaforoDot";
import { ProgressBar } from "../components/common/ProgressBar";
import { DataTable, type Columna } from "../components/common/DataTable";
import { EmptyState } from "../components/common/EmptyState";
import { estatusClases, delegacionClases } from "../utils/badges";
import { semaforoDe, esperadoDe } from "../utils/elementHelpers";
import { estaVencido } from "../utils/dates";
import type { Objetivo } from "../types";

export default function LiderDashboard() {
  const { usuario } = useAuth();
  const { objetivos, actividades, delegaciones, actualizaciones, bloqueos, hijosDeUsuario } = useApp();
  const navigate = useNavigate();
  if (!usuario) return null;

  const misObjetivos = useMemo(() => objetivos.filter((o) => o.responsableId === usuario.id), [objetivos, usuario.id]);
  const objetivosIds = useMemo(() => new Set(misObjetivos.map((o) => o.id)), [misObjetivos]);
  const misActividades = useMemo(() => actividades.filter((a) => objetivosIds.has(a.objetivoId)), [actividades, objetivosIds]);
  const equipo = useMemo(() => hijosDeUsuario(usuario.id), [hijosDeUsuario, usuario.id]);
  const equipoIds = useMemo(() => new Set(equipo.map((u) => u.id)), [equipo]);

  const estrategicoPropio = misObjetivos.find((o) => o.nivel === 1);
  const avanceArea = estrategicoPropio ? estrategicoPropio.avanceCalculado : Math.round(misObjetivos.reduce((s, o) => s + o.avanceCalculado, 0) / (misObjetivos.length || 1));

  const vencidas = misActividades.filter((a) => estaVencido(a.fechaFin) && a.estatus !== "Completado" && a.estatus !== "Cerrado");
  const bloqueadas = misActividades.filter((a) => a.bloqueada);
  const delegacionesPendientes = delegaciones.filter((d) => d.estatus === "Pendiente" && equipoIds.has(d.usuarioOrigenId));
  const avancesPendientes = actualizaciones.filter((u) => u.estatusValidacion === "Pendiente" && equipoIds.has(u.usuarioId));
  const proximasAVencer = misActividades
    .filter((a) => a.estatus !== "Completado" && a.estatus !== "Cerrado")
    .map((a) => ({ a, dias: Math.ceil((new Date(a.fechaFin).getTime() - Date.now()) / 86400000) }))
    .filter((x) => x.dias >= 0 && x.dias <= 10)
    .sort((x, y) => x.dias - y.dias);

  const cargaPorColaborador = useMemo(() => {
    return equipo.map((u) => {
      const asignadas = misActividades.filter((a) => a.responsableEjecutorId === u.id && a.estatus !== "Completado" && a.estatus !== "Cerrado");
      return { nombre: u.nombre.split(" ")[0], actividades: asignadas.length };
    });
  }, [equipo, misActividades]);

  const actividadesPorColaboradorCols: Columna<(typeof equipo)[number]>[] = [
    { key: "nombre", header: "Colaborador", sortValue: (u) => u.nombre, render: (u) => u.nombre },
    { key: "puesto", header: "Puesto", sortValue: (u) => u.puesto, render: (u) => u.puesto },
    {
      key: "asignadas",
      header: "Actividades asignadas",
      sortValue: (u) => misActividades.filter((a) => a.responsableEjecutorId === u.id).length,
      render: (u) => misActividades.filter((a) => a.responsableEjecutorId === u.id).length,
    },
    {
      key: "vencidas",
      header: "Vencidas",
      sortValue: (u) => misActividades.filter((a) => a.responsableEjecutorId === u.id && estaVencido(a.fechaFin) && a.estatus !== "Completado").length,
      render: (u) => {
        const n = misActividades.filter((a) => a.responsableEjecutorId === u.id && estaVencido(a.fechaFin) && a.estatus !== "Completado").length;
        return n > 0 ? <span className="text-danger font-medium">{n}</span> : n;
      },
    },
    {
      key: "bloqueos",
      header: "Bloqueos",
      sortValue: (u) => misActividades.filter((a) => a.responsableEjecutorId === u.id && a.bloqueada).length,
      render: (u) => misActividades.filter((a) => a.responsableEjecutorId === u.id && a.bloqueada).length,
    },
  ];

  const objetivosCols: Columna<Objetivo>[] = [
    {
      key: "nombre",
      header: "Objetivo / Iniciativa",
      sortValue: (o) => o.nombre,
      render: (o) => (
        <div className="flex items-center gap-2">
          <SemaforoDot semaforo={semaforoDe(o)} />
          <span className="font-medium text-navy">{o.nombre}</span>
          <Badge className="bg-slate-100 text-slate-500 border border-slate-200">Nivel {o.nivel}</Badge>
        </div>
      ),
    },
    {
      key: "avance",
      header: "Avance",
      sortValue: (o) => o.avanceCalculado,
      render: (o) => (
        <div className="w-32">
          <ProgressBar valor={o.avanceCalculado} esperado={esperadoDe(o)} mostrarValor />
        </div>
      ),
    },
    { key: "estatus", header: "Estatus", sortValue: (o) => o.estatus, render: (o) => <Badge className={estatusClases[o.estatus]}>{o.estatus}</Badge> },
    {
      key: "accion",
      header: "",
      render: (o) => (
        <Button tamano="sm" variante="secundario" onClick={() => navigate(`/objetivos/${o.id}`)}>
          <Eye size={13} /> Detalle
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader titulo={`Panel de ${usuario.puesto}`} subtitulo="Seguimiento operativo de los objetivos, iniciativas y equipo a tu cargo" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard titulo="Objetivos asignados" valor={misObjetivos.length} icono={Target} colorIcono="#1F5A94" />
        <KpiCard titulo="Avance del área" valor={`${Math.round(avanceArea)}%`} icono={TrendingUp} colorIcono="#1F9D68" />
        <KpiCard titulo="Actividades vencidas" valor={vencidas.length} icono={AlertOctagon} colorIcono="#D64545" />
        <KpiCard titulo="Actividades bloqueadas" valor={bloqueadas.length} icono={Lock} colorIcono="#D64545" />
        <KpiCard titulo="Delegaciones pendientes" valor={delegacionesPendientes.length} icono={Users2} colorIcono="#F4B740" />
        <KpiCard titulo="Avances por validar" valor={avancesPendientes.length} icono={ClipboardCheck} colorIcono="#F4B740" />
        <KpiCard titulo="Integrantes de equipo" valor={equipo.length} icono={Users2} colorIcono="#1F5A94" />
        <KpiCard titulo="Próximas a vencer (10 días)" valor={proximasAVencer.length} icono={AlertOctagon} colorIcono="#F4B740" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <Card title="Objetivos e iniciativas asignados" className="lg:col-span-2">
          <DataTable columnas={objetivosCols} datos={misObjetivos} filaKey={(o) => o.id} vacioTitulo="Aún no tienes objetivos asignados" />
        </Card>
        <Card title="Carga de trabajo por colaborador">
          {cargaPorColaborador.length === 0 ? (
            <EmptyState titulo="Sin integrantes" mensaje="Aún no tienes colaboradores asignados." />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={cargaPorColaborador} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#EEF2F6" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="nombre" tick={{ fontSize: 11 }} width={70} />
                <RTooltip />
                <Bar dataKey="actividades" fill="#1F5A94" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        <Card
          title="Actividades próximas a vencer"
          actions={
            <Button tamano="sm" variante="fantasma" onClick={() => navigate("/gantt")}>
              Ver Gantt <ArrowRight size={13} />
            </Button>
          }
        >
          {proximasAVencer.length === 0 ? (
            <EmptyState titulo="Sin actividades próximas a vencer" />
          ) : (
            <ul className="divide-y divide-slate-100">
              {proximasAVencer.slice(0, 6).map(({ a, dias }) => (
                <li key={a.id} className="py-2.5 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-navy truncate">{a.nombre}</p>
                    <p className="text-xs text-slate-400">Vence en {dias} día(s)</p>
                  </div>
                  <Badge className={dias <= 3 ? "bg-red-50 text-danger border border-red-200" : "bg-amber-50 text-amber-700 border border-amber-200"}>
                    {dias} d
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card
          title="Solicitudes de delegación pendientes"
          actions={
            <Button tamano="sm" variante="fantasma" onClick={() => navigate("/aprobaciones")}>
              Ir a Aprobaciones <ArrowRight size={13} />
            </Button>
          }
        >
          {delegacionesPendientes.length === 0 ? (
            <EmptyState titulo="No hay delegaciones pendientes" />
          ) : (
            <ul className="divide-y divide-slate-100">
              {delegacionesPendientes.map((d) => {
                const act = actividades.find((a) => a.id === d.actividadId);
                return (
                  <li key={d.id} className="py-2.5 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-navy truncate">{act?.nombre}</p>
                      <p className="text-xs text-slate-400 truncate">{d.motivo}</p>
                    </div>
                    <Badge className={delegacionClases.Pendiente}>Pendiente</Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      <Card title="Mi equipo" actions={<Button tamano="sm" variante="secundario" onClick={() => navigate("/equipo")}>Ver equipo completo <ArrowRight size={13} /></Button>}>
        <DataTable columnas={actividadesPorColaboradorCols} datos={equipo} filaKey={(u) => u.id} vacioTitulo="Aún no tienes colaboradores asignados" />
      </Card>
    </div>
  );
}
