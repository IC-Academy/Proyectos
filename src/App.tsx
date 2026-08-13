import React, { useEffect, useState } from "react";
import { useApp } from "./context/AppContext";
import { Login } from "./pages/Login";
import { Layout } from "./components/Layout";
import { ActividadDetailModal } from "./components/ActividadDetailModal";

import { ResumenEjecutivo, ObjetivosEstrategicos, CascadaPage, GanttPage, AlertasPage, EvidenciasDireccionPage } from "./pages/direccion/DireccionPages";
import { MisObjetivosLider, ProyectosDelArea, MiEquipo, ActividadesLider, SolicitudesLider, AprobacionesLider, GanttLider } from "./pages/lider/LiderPages";
import { MiResumenColaborador, MisObjetivosColaborador, MisActividadesColaborador, MiPlanColaborador, EvidenciasColaborador, SolicitudesColaborador } from "./pages/colaborador/ColaboradorPages";
import { ResumenAdmin, UsuariosAdmin, AreasAdmin, PeriodosAdmin, ConfiguracionAdmin, AprobacionesAdmin, BitacoraAdmin, IntegracionEddAdmin } from "./pages/admin/AdminPages";

const TITULOS: Record<string, Record<string, [string, string]>> = {
  Administrador: {
    resumen: ["Resumen", "Vista general del portal y de tus actividades"],
    usuarios: ["Usuarios", "Administración de usuarios simulados"],
    areas: ["Áreas", "Estructura organizacional"],
    periodos: ["Periodos", "Años fiscales y ciclos"],
    configuracion: ["Configuración", "Catálogos e integraciones"],
    aprobaciones: ["Aprobaciones", "Solicitudes interárea del sistema"],
    bitacora: ["Bitácora", "Historial de movimientos"],
    edd: ["Integración EDD", "Compatibilidad con Evaluación de Desempeño"],
  },
  Direccion: {
    resumen: ["Resumen ejecutivo", "Cascada completa y desempeño consolidado"],
    objetivos: ["Objetivos estratégicos", "Construcción y seguimiento con asistente SMART"],
    cascada: ["Cascada", "Objetivo → Área → Proyecto → Actividad → Subactividad"],
    gantt: ["Gantt", "Cronograma consolidado"],
    alertas: ["Alertas", "Cuellos de botella y solicitudes pendientes"],
    evidencias: ["Evidencias", "Evidencias registradas en la organización"],
  },
  Lider: {
    "mis-objetivos": ["Mis objetivos", "Objetivos donde participa tu área"],
    proyectos: ["Proyectos del área", "Metas derivadas de los objetivos"],
    equipo: ["Mi equipo", "Carga de trabajo de tus colaboradores"],
    actividades: ["Actividades", "Asignación y seguimiento de tu proyecto"],
    solicitudes: ["Solicitudes", "Solicitudes de apoyo que has creado"],
    aprobaciones: ["Aprobaciones", "Solicitudes interárea pendientes de tu decisión"],
    gantt: ["Gantt", "Cronograma de tu área"],
  },
  Colaborador: {
    resumen: ["Mi resumen", "Tu actividad reciente"],
    "mis-objetivos": ["Mis objetivos", "Cómo contribuyes al objetivo estratégico"],
    "mis-actividades": ["Mis actividades", "Actividades que te asignaron"],
    "mi-plan": ["Mi plan", "Divide tu trabajo en subactividades"],
    evidencias: ["Evidencias", "Evidencia simulada de tu trabajo"],
    solicitudes: ["Solicitudes", "Apoyo que has solicitado a otras áreas"],
  },
};

const DEFAULT_KEY: Record<string, string> = { Administrador: "resumen", Direccion: "resumen", Lider: "mis-objetivos", Colaborador: "resumen" };

export function App() {
  const { usuarioActual } = useApp();
  const [activeKey, setActiveKey] = useState<string>("");
  const [actividadAbiertaId, setActividadAbiertaId] = useState<string | null>(null);
  const [proyectoSeleccionadoLider, setProyectoSeleccionadoLider] = useState<string | null>(null);

  useEffect(() => {
    if (usuarioActual) setActiveKey(DEFAULT_KEY[usuarioActual.rol]);
    else setActiveKey("");
  }, [usuarioActual?.usuarioId]);

  if (!usuarioActual) return <Login />;

  function navegarEntidad(tipo: string, id: string) {
    if (tipo === "Actividad") {
      setActividadAbiertaId(id);
    } else if (tipo === "Solicitud") {
      setActiveKey(usuarioActual!.rol === "Colaborador" ? "solicitudes" : usuarioActual!.rol === "Direccion" ? "alertas" : "aprobaciones");
    } else if (tipo === "Objetivo") {
      setActiveKey(usuarioActual!.rol === "Direccion" ? "objetivos" : "mis-objetivos");
    }
  }

  const [titulo, subtitulo] = TITULOS[usuarioActual.rol]?.[activeKey] ?? ["Portal", ""];

  function renderPagina() {
    switch (usuarioActual!.rol) {
      case "Administrador":
        switch (activeKey) {
          case "resumen":
            return <ResumenAdmin onAbrirActividad={setActividadAbiertaId} />;
          case "usuarios":
            return <UsuariosAdmin />;
          case "areas":
            return <AreasAdmin />;
          case "periodos":
            return <PeriodosAdmin />;
          case "configuracion":
            return <ConfiguracionAdmin />;
          case "aprobaciones":
            return <AprobacionesAdmin />;
          case "bitacora":
            return <BitacoraAdmin />;
          case "edd":
            return <IntegracionEddAdmin />;
        }
        break;
      case "Direccion":
        switch (activeKey) {
          case "resumen":
            return <ResumenEjecutivo onAbrirActividad={setActividadAbiertaId} />;
          case "objetivos":
            return <ObjetivosEstrategicos />;
          case "cascada":
            return <CascadaPage />;
          case "gantt":
            return <GanttPage />;
          case "alertas":
            return <AlertasPage onAbrirActividad={setActividadAbiertaId} />;
          case "evidencias":
            return <EvidenciasDireccionPage onAbrirActividad={setActividadAbiertaId} />;
        }
        break;
      case "Lider":
        switch (activeKey) {
          case "mis-objetivos":
            return <MisObjetivosLider />;
          case "proyectos":
            return (
              <ProyectosDelArea
                onAbrirProyecto={(id) => {
                  setProyectoSeleccionadoLider(id);
                  setActiveKey("actividades");
                }}
              />
            );
          case "equipo":
            return <MiEquipo onAbrirActividad={setActividadAbiertaId} />;
          case "actividades":
            return <ActividadesLider onAbrirActividad={setActividadAbiertaId} proyectoIdInicial={proyectoSeleccionadoLider} />;
          case "solicitudes":
            return <SolicitudesLider />;
          case "aprobaciones":
            return <AprobacionesLider />;
          case "gantt":
            return <GanttLider />;
        }
        break;
      case "Colaborador":
        switch (activeKey) {
          case "resumen":
            return <MiResumenColaborador onAbrirActividad={setActividadAbiertaId} />;
          case "mis-objetivos":
            return <MisObjetivosColaborador />;
          case "mis-actividades":
            return <MisActividadesColaborador onAbrirActividad={setActividadAbiertaId} />;
          case "mi-plan":
            return <MiPlanColaborador onAbrirActividad={setActividadAbiertaId} />;
          case "evidencias":
            return <EvidenciasColaborador onAbrirActividad={setActividadAbiertaId} />;
          case "solicitudes":
            return <SolicitudesColaborador />;
        }
        break;
    }
    return null;
  }

  return (
    <Layout
      activeKey={activeKey}
      onNavigate={(key) => {
        setActiveKey(key);
        if (key !== "actividades") setProyectoSeleccionadoLider(null);
      }}
      title={titulo}
      subtitle={subtitulo}
      onNavigateEntidad={navegarEntidad}
    >
      {renderPagina()}
      {actividadAbiertaId && (
        <ActividadDetailModal actividadId={actividadAbiertaId} onClose={() => setActividadAbiertaId(null)} onAbrirActividad={(id) => setActividadAbiertaId(id)} />
      )}
    </Layout>
  );
}
