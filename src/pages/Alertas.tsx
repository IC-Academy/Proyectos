import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCheck, AlertTriangle, Clock, Lock, Users2, ClipboardCheck, Scale, TrendingDown, FileEdit } from "lucide-react";
import { useApp } from "../context/AppContext";
import { PageHeader } from "../components/common/PageHeader";
import { Card } from "../components/common/Card";
import { Badge } from "../components/common/Badge";
import { Button } from "../components/common/Button";
import { EmptyState } from "../components/common/EmptyState";
import { Select } from "../components/common/Field";
import { prioridadClases } from "../utils/badges";
import { formatFecha } from "../utils/dates";
import type { TipoAlerta } from "../types";

const iconoPorTipo: Record<TipoAlerta, typeof Bell> = {
  "Próximo a vencer": Clock,
  Vencido: AlertTriangle,
  "Sin actualización": Clock,
  "Bloqueo crítico": Lock,
  "Delegación pendiente": Users2,
  "Avance pendiente de validar": ClipboardCheck,
  "Pesos no suman 100%": Scale,
  "Desviación crítica": TrendingDown,
  "Solicitud de cambio pendiente": FileEdit,
};

export default function Alertas() {
  const { alertasVisibles, marcarAlertaLeida, marcarTodasAlertasLeidas } = useApp();
  const navigate = useNavigate();
  const [filtroTipo, setFiltroTipo] = useState("Todos");
  const [filtroPrioridad, setFiltroPrioridad] = useState("Todas");
  const [soloNoLeidas, setSoloNoLeidas] = useState(false);

  const tipos = Array.from(new Set(alertasVisibles.map((a) => a.tipo)));

  const filtradas = useMemo(() => {
    return alertasVisibles
      .filter((a) => (filtroTipo === "Todos" ? true : a.tipo === filtroTipo))
      .filter((a) => (filtroPrioridad === "Todas" ? true : a.prioridad === filtroPrioridad))
      .filter((a) => (soloNoLeidas ? !a.leida : true));
  }, [alertasVisibles, filtroTipo, filtroPrioridad, soloNoLeidas]);

  const noLeidas = alertasVisibles.filter((a) => !a.leida).length;

  function irAlElemento(elementoId?: string, tipoElemento?: "objetivo" | "actividad") {
    if (!elementoId) return;
    if (tipoElemento === "objetivo") navigate(`/objetivos/${elementoId}`);
    // Para actividades no hay ruta propia; se navega desde Mis actividades / Gantt.
  }

  return (
    <div>
      <PageHeader
        titulo="Centro de alertas"
        subtitulo={`${noLeidas} alerta(s) sin leer`}
        acciones={
          <Button variante="secundario" onClick={marcarTodasAlertasLeidas} disabled={noLeidas === 0}>
            <CheckCheck size={14} /> Marcar todas como leídas
          </Button>
        }
      />

      <div className="flex flex-wrap gap-3 mb-4">
        <Select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)} className="max-w-[220px]">
          <option value="Todos">Todos los tipos</option>
          {tipos.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </Select>
        <Select value={filtroPrioridad} onChange={(e) => setFiltroPrioridad(e.target.value)} className="max-w-[160px]">
          <option value="Todas">Toda prioridad</option>
          <option value="Alta">Alta</option>
          <option value="Media">Media</option>
          <option value="Baja">Baja</option>
        </Select>
        <label className="flex items-center gap-2 text-sm text-slate-600 px-2">
          <input type="checkbox" checked={soloNoLeidas} onChange={(e) => setSoloNoLeidas(e.target.checked)} />
          Solo no leídas
        </label>
      </div>

      {filtradas.length === 0 ? (
        <Card>
          <EmptyState icono={Bell} titulo="No hay alertas que coincidan con los filtros" />
        </Card>
      ) : (
        <div className="space-y-2">
          {filtradas.map((a) => {
            const Icono = iconoPorTipo[a.tipo] ?? Bell;
            return (
              <Card key={a.id} className={a.leida ? "opacity-70" : ""}>
                <div className="flex items-start gap-3">
                  <span className={`rounded-lg p-2 shrink-0 ${a.leida ? "bg-slate-100 text-slate-400" : "bg-brand-light text-brand-blue"}`}>
                    <Icono size={16} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <p className="text-sm font-semibold text-navy">{a.titulo}</p>
                      <Badge className={prioridadClases[a.prioridad]}>{a.prioridad}</Badge>
                      {!a.leida && <span className="h-2 w-2 rounded-full bg-brand-blue" />}
                    </div>
                    <p className="text-xs text-slate-500">{a.descripcion}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-[11px] text-slate-400">{formatFecha(a.fecha)}</span>
                      {a.tipoElemento === "objetivo" && (
                        <button className="text-[11px] text-brand-blue hover:underline" onClick={() => irAlElemento(a.elementoId, a.tipoElemento)}>
                          Ver objetivo
                        </button>
                      )}
                    </div>
                  </div>
                  {!a.leida && (
                    <Button tamano="sm" variante="secundario" onClick={() => marcarAlertaLeida(a.id)}>
                      Marcar leída
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
