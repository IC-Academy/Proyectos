import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts";
import { Target, CheckCircle2, AlertTriangle, XOctagon, TrendingUp, Lock, Clock, Eye } from "lucide-react";
import { useApp } from "../context/AppContext";
import { PageHeader } from "../components/common/PageHeader";
import { KpiCard } from "../components/common/KpiCard";
import { Card } from "../components/common/Card";
import { DataTable, type Columna } from "../components/common/DataTable";
import { Badge } from "../components/common/Badge";
import { SemaforoDot } from "../components/common/SemaforoDot";
import { ProgressBar } from "../components/common/ProgressBar";
import { Select } from "../components/common/Field";
import { Button } from "../components/common/Button";
import { estatusClases, prioridadClases, riesgoClases } from "../utils/badges";
import { semaforoDe, esperadoDe, desviacionDe } from "../utils/elementHelpers";
import { formatFecha } from "../utils/dates";
import type { Area, Prioridad, NivelRiesgo, EstatusElemento } from "../types";

const COLORES_RIESGO: Record<NivelRiesgo, string> = {
  "Sin riesgo": "#94A3B8",
  Bajo: "#1F9D68",
  Medio: "#F4B740",
  Alto: "#F97316",
  "Crítico": "#D64545",
};

const COLORES_ESTATUS: Record<string, string> = {
  "Sin iniciar": "#94A3B8",
  "En tiempo": "#1F9D68",
  "En riesgo": "#F4B740",
  Retrasado: "#F4B740",
  Vencido: "#D64545",
  Completado: "#1F5A94",
  Cerrado: "#64748B",
};

export default function DirectorDashboard() {
  const { objetivos, actividades, bloqueos, alertasVisibles, usuarios } = useApp();
  const navigate = useNavigate();

  const estrategicos = useMemo(() => objetivos.filter((o) => o.nivel === 1), [objetivos]);

  const [filtroArea, setFiltroArea] = useState<string>("Todas");
  const [filtroResponsable, setFiltroResponsable] = useState<string>("Todos");
  const [filtroEstatus, setFiltroEstatus] = useState<string>("Todos");
  const [filtroPrioridad, setFiltroPrioridad] = useState<string>("Todas");
  const [filtroRiesgo, setFiltroRiesgo] = useState<string>("Todos");

  const kpis = useMemo(() => {
    const enTiempo = estrategicos.filter((o) => o.estatus === "En tiempo" || o.estatus === "Completado").length;
    const enRiesgo = estrategicos.filter((o) => o.estatus === "En riesgo" || o.estatus === "Retrasado").length;
    const vencidos = estrategicos.filter((o) => o.estatus === "Vencido").length;
    const sumaPeso = estrategicos.reduce((s, o) => s + o.peso, 0) || 1;
    const avanceGlobal = estrategicos.reduce((s, o) => s + (o.avanceCalculado * o.peso) / sumaPeso, 0);
    const esperadoGlobal = estrategicos.reduce((s, o) => s + (esperadoDe(o) * o.peso) / sumaPeso, 0);
    const bloqueosActivos = bloqueos.filter((b) => b.estatus !== "Resuelto").length;
    const sinActualizacion = alertasVisibles.filter((a) => a.tipo === "Sin actualización").length;
    return { enTiempo, enRiesgo, vencidos, avanceGlobal, esperadoGlobal, bloqueosActivos, sinActualizacion };
  }, [estrategicos, bloqueos, alertasVisibles]);

  const dataAvanceVsEsperado = useMemo(
    () =>
      estrategicos.map((o) => ({
        nombre: o.nombre.length > 22 ? o.nombre.slice(0, 22) + "…" : o.nombre,
        real: o.avanceCalculado,
        esperado: esperadoDe(o),
      })),
    [estrategicos]
  );

  const dataEstatus = useMemo(() => {
    const grupos: Record<string, number> = {};
    estrategicos.forEach((o) => {
      grupos[o.estatus] = (grupos[o.estatus] || 0) + 1;
    });
    return Object.entries(grupos).map(([name, value]) => ({ name, value }));
  }, [estrategicos]);

  const dataArea = useMemo(() => {
    const grupos: Record<string, { suma: number; n: number }> = {};
    estrategicos.forEach((o) => {
      grupos[o.area] = grupos[o.area] || { suma: 0, n: 0 };
      grupos[o.area].suma += o.avanceCalculado;
      grupos[o.area].n += 1;
    });
    return Object.entries(grupos).map(([area, v]) => ({ area, avance: Math.round(v.suma / v.n) }));
  }, [estrategicos]);

  const dataRiesgo = useMemo(() => {
    const grupos: Record<string, number> = {};
    estrategicos.forEach((o) => {
      grupos[o.riesgo] = (grupos[o.riesgo] || 0) + 1;
    });
    return Object.entries(grupos).map(([name, value]) => ({ name, value }));
  }, [estrategicos]);

  const dataTendencia = useMemo(() => {
    // Tendencia simulada de los últimos 6 meses hacia el avance global actual.
    const meses = ["Mar", "Abr", "May", "Jun", "Jul", "Ago"];
    const objetivo = kpis.avanceGlobal;
    return meses.map((m, i) => ({
      mes: m,
      avance: Math.max(0, Math.round(objetivo * (0.45 + (i * 0.55) / (meses.length - 1)))),
    }));
  }, [kpis.avanceGlobal]);

  const dataLideres = useMemo(() => {
    const lideres = usuarios.filter((u) => u.rol === "Lider");
    return lideres.map((l) => {
      const suyos = estrategicos.filter((o) => o.responsableId === l.id);
      const areaObjetivos = objetivos.filter((o) => o.nivel === 2 && o.responsableId === l.id);
      const base = suyos.length > 0 ? suyos : areaObjetivos;
      const avance = base.length > 0 ? Math.round(base.reduce((s, o) => s + o.avanceCalculado, 0) / base.length) : 0;
      return { nombre: l.nombre.split(" ")[0], avance };
    });
  }, [usuarios, estrategicos, objetivos]);

  const filaExtendida = useMemo(() => {
    return estrategicos.map((o) => {
      const responsable = usuarios.find((u) => u.id === o.responsableId);
      return { objetivo: o, responsable };
    });
  }, [estrategicos, usuarios]);

  const filtrados = useMemo(() => {
    return filaExtendida.filter(({ objetivo, responsable }) => {
      if (filtroArea !== "Todas" && objetivo.area !== filtroArea) return false;
      if (filtroResponsable !== "Todos" && responsable?.id !== filtroResponsable) return false;
      if (filtroEstatus !== "Todos" && objetivo.estatus !== filtroEstatus) return false;
      if (filtroPrioridad !== "Todas" && objetivo.prioridad !== filtroPrioridad) return false;
      if (filtroRiesgo !== "Todos" && objetivo.riesgo !== filtroRiesgo) return false;
      return true;
    });
  }, [filaExtendida, filtroArea, filtroResponsable, filtroEstatus, filtroPrioridad, filtroRiesgo]);

  const columnas: Columna<(typeof filaExtendida)[number]>[] = [
    {
      key: "objetivo",
      header: "Objetivo",
      sortValue: (r) => r.objetivo.nombre,
      render: (r) => (
        <div className="flex items-center gap-2 min-w-[220px]">
          <SemaforoDot semaforo={semaforoDe(r.objetivo)} />
          <span className="font-medium text-navy">{r.objetivo.nombre}</span>
        </div>
      ),
    },
    { key: "responsable", header: "Responsable", sortValue: (r) => r.responsable?.nombre ?? "", render: (r) => r.responsable?.nombre ?? "-" },
    { key: "area", header: "Área", sortValue: (r) => r.objetivo.area, render: (r) => r.objetivo.area },
    { key: "fecha", header: "Fecha compromiso", sortValue: (r) => r.objetivo.fechaFin, render: (r) => formatFecha(r.objetivo.fechaFin) },
    {
      key: "avance",
      header: "Avance real",
      sortValue: (r) => r.objetivo.avanceCalculado,
      render: (r) => (
        <div className="w-28">
          <ProgressBar valor={r.objetivo.avanceCalculado} esperado={esperadoDe(r.objetivo)} mostrarValor />
        </div>
      ),
    },
    { key: "esperado", header: "Avance esperado", sortValue: (r) => esperadoDe(r.objetivo), render: (r) => `${Math.round(esperadoDe(r.objetivo))}%` },
    {
      key: "desviacion",
      header: "Desviación",
      sortValue: (r) => desviacionDe(r.objetivo),
      render: (r) => {
        const d = desviacionDe(r.objetivo);
        return <span className={d < -5 ? "text-danger font-medium" : d < 0 ? "text-amber-600" : "text-success"}>{d > 0 ? `+${d}` : d} pts</span>;
      },
    },
    { key: "riesgo", header: "Riesgo", sortValue: (r) => r.objetivo.riesgo, render: (r) => <Badge className={riesgoClases[r.objetivo.riesgo]}>{r.objetivo.riesgo}</Badge> },
    { key: "estatus", header: "Estatus", sortValue: (r) => r.objetivo.estatus, render: (r) => <Badge className={estatusClases[r.objetivo.estatus]}>{r.objetivo.estatus}</Badge> },
    {
      key: "accion",
      header: "",
      render: (r) => (
        <Button tamano="sm" variante="secundario" onClick={() => navigate(`/objetivos/${r.objetivo.id}`)}>
          <Eye size={13} /> Ver detalle
        </Button>
      ),
    },
  ];

  const areas: Area[] = ["Operaciones", "Recursos Humanos", "Finanzas", "Tecnología", "Comercial"];
  const prioridades: Prioridad[] = ["Alta", "Media", "Baja"];
  const riesgos: NivelRiesgo[] = ["Sin riesgo", "Bajo", "Medio", "Alto", "Crítico"];
  const estatusList: EstatusElemento[] = ["Sin iniciar", "En tiempo", "En riesgo", "Retrasado", "Vencido", "Completado", "Cerrado"];
  const lideres = usuarios.filter((u) => u.rol === "Lider");

  return (
    <div>
      <PageHeader titulo="Panel ejecutivo" subtitulo="Visión consolidada del avance estratégico de la organización" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard titulo="Objetivos estratégicos" valor={estrategicos.length} icono={Target} colorIcono="#1F5A94" />
        <KpiCard titulo="En tiempo" valor={kpis.enTiempo} icono={CheckCircle2} colorIcono="#1F9D68" />
        <KpiCard titulo="En riesgo" valor={kpis.enRiesgo} icono={AlertTriangle} colorIcono="#F4B740" />
        <KpiCard titulo="Vencidos" valor={kpis.vencidos} icono={XOctagon} colorIcono="#D64545" />
        <KpiCard titulo="Avance global" valor={`${Math.round(kpis.avanceGlobal)}%`} icono={TrendingUp} colorIcono="#1F5A94" subtitulo={`Esperado ${Math.round(kpis.esperadoGlobal)}%`} tendencia={kpis.avanceGlobal >= kpis.esperadoGlobal ? "up" : "down"} />
        <KpiCard titulo="Avance esperado global" valor={`${Math.round(kpis.esperadoGlobal)}%`} icono={Clock} colorIcono="#1F5A94" />
        <KpiCard titulo="Bloqueos activos" valor={kpis.bloqueosActivos} icono={Lock} colorIcono="#D64545" />
        <KpiCard titulo="Actividades sin actualizar" valor={kpis.sinActualizacion} icono={AlertTriangle} colorIcono="#F4B740" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        <Card title="Avance real vs. esperado por objetivo">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={dataAvanceVsEsperado} margin={{ left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEF2F6" />
              <XAxis dataKey="nombre" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
              <RTooltip />
              <Legend />
              <Bar dataKey="real" name="Avance real" fill="#1F5A94" radius={[4, 4, 0, 0]} />
              <Bar dataKey="esperado" name="Avance esperado" fill="#D9EAF7" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Distribución de objetivos por estatus">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={dataEstatus} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                {dataEstatus.map((d, i) => (
                  <Cell key={i} fill={COLORES_ESTATUS[d.name] ?? "#94A3B8"} />
                ))}
              </Pie>
              <Legend />
              <RTooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Avance por área">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={dataArea} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#EEF2F6" />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="area" tick={{ fontSize: 11 }} width={110} />
              <RTooltip />
              <Bar dataKey="avance" fill="#1F5A94" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Objetivos por nivel de riesgo">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={dataRiesgo} dataKey="value" nameKey="name" outerRadius={90}>
                {dataRiesgo.map((d, i) => (
                  <Cell key={i} fill={COLORES_RIESGO[d.name as NivelRiesgo] ?? "#94A3B8"} />
                ))}
              </Pie>
              <Legend />
              <RTooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Tendencia simulada del avance global">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={dataTendencia}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEF2F6" />
              <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <RTooltip />
              <Line type="monotone" dataKey="avance" stroke="#1F5A94" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Contribución de cada líder al avance global">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={dataLideres}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEF2F6" />
              <XAxis dataKey="nombre" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <RTooltip />
              <Bar dataKey="avance" fill="#1F9D68" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card title="Tabla ejecutiva de objetivos estratégicos">
        <div className="flex flex-wrap gap-3 mb-4">
          <Select value={filtroArea} onChange={(e) => setFiltroArea(e.target.value)} className="max-w-[160px]">
            <option value="Todas">Todas las áreas</option>
            {areas.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </Select>
          <Select value={filtroResponsable} onChange={(e) => setFiltroResponsable(e.target.value)} className="max-w-[180px]">
            <option value="Todos">Todos los responsables</option>
            {lideres.map((l) => (
              <option key={l.id} value={l.id}>{l.nombre}</option>
            ))}
          </Select>
          <Select value={filtroEstatus} onChange={(e) => setFiltroEstatus(e.target.value)} className="max-w-[160px]">
            <option value="Todos">Todos los estatus</option>
            {estatusList.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
          <Select value={filtroPrioridad} onChange={(e) => setFiltroPrioridad(e.target.value)} className="max-w-[150px]">
            <option value="Todas">Toda prioridad</option>
            {prioridades.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </Select>
          <Select value={filtroRiesgo} onChange={(e) => setFiltroRiesgo(e.target.value)} className="max-w-[150px]">
            <option value="Todos">Todo riesgo</option>
            {riesgos.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </Select>
        </div>
        <DataTable
          columnas={columnas}
          datos={filtrados}
          filaKey={(r) => r.objetivo.id}
          buscablePor={(r) => `${r.objetivo.nombre} ${r.responsable?.nombre ?? ""}`}
          vacioTitulo="Sin objetivos que coincidan con los filtros"
        />
      </Card>
    </div>
  );
}
