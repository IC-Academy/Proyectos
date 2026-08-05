import React, { useMemo } from "react";
import { Download } from "lucide-react";
import { useApp } from "../context/AppContext";
import { useAuth } from "../hooks/useAuth";
import { PageHeader } from "../components/common/PageHeader";
import { Card } from "../components/common/Card";
import { Button } from "../components/common/Button";
import { DataTable, type Columna } from "../components/common/DataTable";
import { ProgressBar } from "../components/common/ProgressBar";
import { RoleGuard } from "../components/layout/RoleGuard";
import { esperadoDe } from "../utils/elementHelpers";
import type { Area } from "../types";

interface FilaArea {
  area: Area;
  objetivos: number;
  avancePromedio: number;
  esperadoPromedio: number;
  enRiesgo: number;
  vencidos: number;
}

function ReportesContenido() {
  const { objetivos, actividades, bloqueos, pushToast } = useApp();
  const { usuario } = useAuth();

  const objetivosVisibles = useMemo(() => {
    if (usuario?.rol === "Director") return objetivos.filter((o) => o.nivel === 1);
    return objetivos.filter((o) => o.responsableId === usuario?.id);
  }, [objetivos, usuario]);

  const porArea: FilaArea[] = useMemo(() => {
    const areas = Array.from(new Set(objetivosVisibles.map((o) => o.area))) as Area[];
    return areas.map((area) => {
      const delArea = objetivosVisibles.filter((o) => o.area === area);
      return {
        area,
        objetivos: delArea.length,
        avancePromedio: Math.round(delArea.reduce((s, o) => s + o.avanceCalculado, 0) / delArea.length),
        esperadoPromedio: Math.round(delArea.reduce((s, o) => s + esperadoDe(o), 0) / delArea.length),
        enRiesgo: delArea.filter((o) => o.estatus === "En riesgo" || o.estatus === "Retrasado").length,
        vencidos: delArea.filter((o) => o.estatus === "Vencido").length,
      };
    });
  }, [objetivosVisibles]);

  const columnas: Columna<FilaArea>[] = [
    { key: "area", header: "Área", sortValue: (f) => f.area, render: (f) => f.area },
    { key: "objetivos", header: "Objetivos", sortValue: (f) => f.objetivos, render: (f) => f.objetivos },
    {
      key: "avance",
      header: "Avance promedio",
      sortValue: (f) => f.avancePromedio,
      render: (f) => (
        <div className="w-32">
          <ProgressBar valor={f.avancePromedio} esperado={f.esperadoPromedio} mostrarValor />
        </div>
      ),
    },
    { key: "riesgo", header: "En riesgo/retraso", sortValue: (f) => f.enRiesgo, render: (f) => f.enRiesgo },
    { key: "vencidos", header: "Vencidos", sortValue: (f) => f.vencidos, render: (f) => f.vencidos },
  ];

  const resumenGeneral = {
    totalActividades: usuario?.rol === "Director" ? actividades.length : actividades.filter((a) => objetivosVisibles.some((o) => o.id === a.objetivoId)).length,
    bloqueosAbiertos: bloqueos.filter((b) => b.estatus !== "Resuelto").length,
  };

  function exportar(formato: string) {
    pushToast("info", `Exportar a ${formato} es una función demostrativa en esta beta. Se integrará con Power BI / Excel al conectar Dataverse.`);
  }

  return (
    <div>
      <PageHeader
        titulo="Reportes"
        subtitulo="Resumen consolidado por área para compartir con Dirección"
        acciones={
          <>
            <Button variante="secundario" onClick={() => exportar("Excel")}>
              <Download size={14} /> Exportar Excel
            </Button>
            <Button variante="secundario" onClick={() => exportar("PDF")}>
              <Download size={14} /> Exportar PDF
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <p className="text-xs text-slate-400 uppercase">Objetivos visibles</p>
          <p className="text-2xl font-bold text-navy">{objetivosVisibles.length}</p>
        </Card>
        <Card>
          <p className="text-xs text-slate-400 uppercase">Actividades totales</p>
          <p className="text-2xl font-bold text-navy">{resumenGeneral.totalActividades}</p>
        </Card>
        <Card>
          <p className="text-xs text-slate-400 uppercase">Bloqueos abiertos</p>
          <p className="text-2xl font-bold text-danger">{resumenGeneral.bloqueosAbiertos}</p>
        </Card>
        <Card>
          <p className="text-xs text-slate-400 uppercase">Áreas cubiertas</p>
          <p className="text-2xl font-bold text-navy">{porArea.length}</p>
        </Card>
      </div>

      <Card title="Avance consolidado por área">
        <DataTable columnas={columnas} datos={porArea} filaKey={(f) => f.area} />
      </Card>
    </div>
  );
}

export default function Reportes() {
  return (
    <RoleGuard roles={["Director", "Lider"]}>
      <ReportesContenido />
    </RoleGuard>
  );
}
