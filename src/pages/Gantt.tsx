import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { useAuth } from "../hooks/useAuth";
import { PageHeader } from "../components/common/PageHeader";
import { Card } from "../components/common/Card";
import { Select } from "../components/common/Field";
import { GanttChart, type FilaGantt } from "../components/common/GanttChart";
import { semaforoDe } from "../utils/elementHelpers";
import type { Area, Prioridad, EstatusElemento } from "../types";

export default function GanttView() {
  const { usuario } = useAuth();
  const { objetivos, actividades, getUsuario } = useApp();
  const navigate = useNavigate();

  const [area, setArea] = useState("Todas");
  const [responsable, setResponsable] = useState("Todos");
  const [nivel, setNivel] = useState("Todos");
  const [estatus, setEstatus] = useState("Todos");
  const [prioridad, setPrioridad] = useState("Todas");

  const alcance = useMemo(() => {
    if (!usuario) return { objetivos: [] as typeof objetivos, actividades: [] as typeof actividades };
    if (usuario.rol === "Director") return { objetivos, actividades };
    if (usuario.rol === "Lider") {
      const propios = objetivos.filter((o) => o.responsableId === usuario.id);
      const idsIniciativas = new Set(propios.filter((o) => o.nivel === 3).map((o) => o.id));
      const actividadesPropias = actividades.filter((a) => idsIniciativas.has(a.objetivoId));
      // Incluir ancestros para que el árbol tenga sentido visual.
      const idsAncestros = new Set<string>();
      propios.forEach((o) => {
        let actual = o;
        while (actual.parentId) {
          idsAncestros.add(actual.parentId);
          const padre = objetivos.find((x) => x.id === actual.parentId);
          if (!padre) break;
          actual = padre;
        }
      });
      const ancestros = objetivos.filter((o) => idsAncestros.has(o.id));
      return { objetivos: [...ancestros, ...propios], actividades: actividadesPropias };
    }
    const actividadesPropias = actividades.filter((a) => a.responsableEjecutorId === usuario.id);
    return { objetivos: [], actividades: actividadesPropias };
  }, [usuario, objetivos, actividades]);

  const filas: FilaGantt[] = useMemo(() => {
    const deObjetivos: FilaGantt[] = alcance.objetivos
      .filter((o) => (area === "Todas" ? true : o.area === area))
      .filter((o) => (responsable === "Todos" ? true : o.responsableId === responsable))
      .filter((o) => (nivel === "Todos" ? true : String(o.nivel) === nivel))
      .filter((o) => (estatus === "Todos" ? true : o.estatus === estatus))
      .filter((o) => (prioridad === "Todas" ? true : o.prioridad === prioridad))
      .map((o) => ({
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
    const deActividades: FilaGantt[] = alcance.actividades
      .filter((a) => (nivel === "Todos" ? true : String(a.nivel) === nivel))
      .filter((a) => (estatus === "Todos" ? true : a.estatus === estatus))
      .filter((a) => (prioridad === "Todas" ? true : a.prioridad === prioridad))
      .filter((a) => (responsable === "Todos" ? true : a.responsableEjecutorId === responsable))
      .map((a) => ({
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
    return [...deObjetivos, ...deActividades].sort((x, y) => (x.fechaInicio < y.fechaInicio ? -1 : 1));
  }, [alcance, area, responsable, nivel, estatus, prioridad, getUsuario]);

  const areas: Area[] = ["Operaciones", "Recursos Humanos", "Finanzas", "Tecnología", "Comercial"];
  const prioridades: Prioridad[] = ["Alta", "Media", "Baja"];
  const estatusList: EstatusElemento[] = ["Sin iniciar", "En tiempo", "En riesgo", "Retrasado", "Vencido", "Completado", "Cerrado"];
  const responsables = Array.from(new Set([...alcance.objetivos.map((o) => o.responsableId), ...alcance.actividades.map((a) => a.responsableEjecutorId)]))
    .map((id) => getUsuario(id))
    .filter(Boolean);

  function irADetalle(id: string) {
    const esObjetivo = objetivos.some((o) => o.id === id);
    if (esObjetivo) navigate(`/objetivos/${id}`);
    else {
      const act = actividades.find((a) => a.id === id);
      if (act) navigate(`/objetivos/${act.objetivoId}`);
    }
  }

  return (
    <div>
      <PageHeader titulo="Gantt" subtitulo="Vista de calendario de objetivos, iniciativas y actividades" />
      <Card>
        <div className="flex flex-wrap gap-3 mb-4">
          <Select value={area} onChange={(e) => setArea(e.target.value)} className="max-w-[160px]">
            <option value="Todas">Todas las áreas</option>
            {areas.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </Select>
          <Select value={responsable} onChange={(e) => setResponsable(e.target.value)} className="max-w-[180px]">
            <option value="Todos">Todos los responsables</option>
            {responsables.map((r) => (
              <option key={r!.id} value={r!.id}>{r!.nombre}</option>
            ))}
          </Select>
          <Select value={nivel} onChange={(e) => setNivel(e.target.value)} className="max-w-[160px]">
            <option value="Todos">Todos los niveles</option>
            <option value="1">Nivel 1 · Estratégico</option>
            <option value="2">Nivel 2 · Área</option>
            <option value="3">Nivel 3 · Iniciativa</option>
            <option value="4">Nivel 4 · Actividad</option>
            <option value="5">Nivel 5 · Subactividad</option>
          </Select>
          <Select value={estatus} onChange={(e) => setEstatus(e.target.value)} className="max-w-[160px]">
            <option value="Todos">Todos los estatus</option>
            {estatusList.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
          <Select value={prioridad} onChange={(e) => setPrioridad(e.target.value)} className="max-w-[150px]">
            <option value="Todas">Toda prioridad</option>
            {prioridades.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </Select>
        </div>
        <GanttChart filas={filas} onSeleccionar={irADetalle} />
      </Card>
    </div>
  );
}
