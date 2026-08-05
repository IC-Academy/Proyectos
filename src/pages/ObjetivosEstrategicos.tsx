import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Eye } from "lucide-react";
import { useApp } from "../context/AppContext";
import { useAuth } from "../hooks/useAuth";
import { PageHeader } from "../components/common/PageHeader";
import { Card } from "../components/common/Card";
import { Badge } from "../components/common/Badge";
import { Button } from "../components/common/Button";
import { SemaforoDot } from "../components/common/SemaforoDot";
import { ProgressBar } from "../components/common/ProgressBar";
import { DataTable, type Columna } from "../components/common/DataTable";
import { CrearObjetivoModal } from "../components/forms/CrearObjetivoModal";
import { estatusClases, prioridadClases } from "../utils/badges";
import { semaforoDe, esperadoDe } from "../utils/elementHelpers";
import { formatFecha } from "../utils/dates";
import type { Objetivo } from "../types";

export default function ObjetivosEstrategicos() {
  const { usuario } = useAuth();
  const { objetivos, getUsuario } = useApp();
  const navigate = useNavigate();
  const [modalCrear, setModalCrear] = useState(false);

  const lista = useMemo(() => {
    if (!usuario) return [];
    if (usuario.rol === "Director") return objetivos.filter((o) => o.nivel === 1);
    return objetivos.filter((o) => o.responsableId === usuario.id);
  }, [objetivos, usuario]);

  const columnas: Columna<Objetivo>[] = [
    {
      key: "nombre",
      header: "Nombre",
      sortValue: (o) => o.nombre,
      render: (o) => (
        <div className="flex items-center gap-2">
          <SemaforoDot semaforo={semaforoDe(o)} />
          <span className="font-medium text-navy">{o.nombre}</span>
          <Badge className="bg-slate-100 text-slate-500 border border-slate-200">Nivel {o.nivel}</Badge>
        </div>
      ),
    },
    { key: "area", header: "Área", sortValue: (o) => o.area, render: (o) => o.area },
    { key: "responsable", header: "Responsable", sortValue: (o) => getUsuario(o.responsableId)?.nombre ?? "", render: (o) => getUsuario(o.responsableId)?.nombre ?? "-" },
    { key: "fecha", header: "Fecha fin", sortValue: (o) => o.fechaFin, render: (o) => formatFecha(o.fechaFin) },
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
    { key: "prioridad", header: "Prioridad", sortValue: (o) => o.prioridad, render: (o) => <Badge className={prioridadClases[o.prioridad]}>{o.prioridad}</Badge> },
    { key: "estatus", header: "Estatus", sortValue: (o) => o.estatus, render: (o) => <Badge className={estatusClases[o.estatus]}>{o.estatus}</Badge> },
    {
      key: "accion",
      header: "",
      render: (o) => (
        <Button tamano="sm" variante="secundario" onClick={() => navigate(`/objetivos/${o.id}`)}>
          <Eye size={13} /> Ver
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        titulo={usuario?.rol === "Director" ? "Objetivos estratégicos" : "Mis objetivos"}
        subtitulo={
          usuario?.rol === "Director"
            ? "Crea y asigna objetivos estratégicos a los líderes de la organización"
            : "Objetivos e iniciativas de los que eres responsable"
        }
        acciones={
          usuario?.rol === "Director" ? (
            <Button onClick={() => setModalCrear(true)}>
              <Plus size={14} /> Crear objetivo estratégico
            </Button>
          ) : undefined
        }
      />
      <Card>
        <DataTable
          columnas={columnas}
          datos={lista}
          filaKey={(o) => o.id}
          buscablePor={(o) => o.nombre}
          onRowClick={(o) => navigate(`/objetivos/${o.id}`)}
          vacioTitulo="Sin objetivos registrados todavía"
          vacioMensaje={usuario?.rol === "Director" ? "Crea el primer objetivo estratégico con el botón superior." : "Dirección aún no te ha asignado objetivos."}
        />
      </Card>
      <CrearObjetivoModal abierto={modalCrear} onClose={() => setModalCrear(false)} />
    </div>
  );
}
