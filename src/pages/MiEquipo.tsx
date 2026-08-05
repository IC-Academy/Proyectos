import React, { useMemo } from "react";
import { AlertTriangle, Lock, ListChecks } from "lucide-react";
import { useApp } from "../context/AppContext";
import { useAuth } from "../hooks/useAuth";
import { PageHeader } from "../components/common/PageHeader";
import { Card } from "../components/common/Card";
import { ProgressBar } from "../components/common/ProgressBar";
import { SemaforoDot } from "../components/common/SemaforoDot";
import { EmptyState } from "../components/common/EmptyState";
import { RoleGuard } from "../components/layout/RoleGuard";
import { estaVencido, formatFecha } from "../utils/dates";
import type { Semaforo } from "../types";

function semaforoDesempeno(avancePromedio: number, vencidas: number, bloqueos: number): Semaforo {
  if (vencidas === 0 && bloqueos === 0 && avancePromedio >= 60) return "verde";
  if (vencidas >= 2 || bloqueos >= 2) return "rojo";
  if (vencidas === 1 || bloqueos === 1 || avancePromedio < 40) return "amarillo";
  return "verde";
}

function MiEquipoContenido() {
  const { usuario } = useAuth();
  const { actividades, hijosDeUsuario } = useApp();
  const equipo = useMemo(() => (usuario ? hijosDeUsuario(usuario.id) : []), [hijosDeUsuario, usuario]);

  const filas = useMemo(
    () =>
      equipo.map((u) => {
        const propias = actividades.filter((a) => a.responsableEjecutorId === u.id);
        const activas = propias.filter((a) => a.estatus !== "Completado" && a.estatus !== "Cerrado");
        const vencidas = activas.filter((a) => estaVencido(a.fechaFin));
        const bloqueadas = propias.filter((a) => a.bloqueada);
        const avancePromedio = propias.length ? Math.round(propias.reduce((s, a) => s + a.avanceCalculado, 0) / propias.length) : 0;
        const ultimaActualizacion = propias.reduce((max, a) => (a.ultimaActualizacion > max ? a.ultimaActualizacion : max), "");
        return {
          usuario: u,
          totalAsignadas: propias.length,
          vencidas: vencidas.length,
          bloqueadas: bloqueadas.length,
          avancePromedio,
          ultimaActualizacion,
          semaforo: semaforoDesempeno(avancePromedio, vencidas.length, bloqueadas.length),
        };
      }),
    [equipo, actividades]
  );

  return (
    <div>
      <PageHeader
        titulo="Mi equipo"
        subtitulo="Seguimiento operativo de compromisos de tu equipo. Esta vista no constituye una evaluación de desempeño laboral."
      />

      {filas.length === 0 ? (
        <Card>
          <EmptyState titulo="Aún no tienes colaboradores asignados" mensaje="Cuando Dirección asigne colaboradores a tu equipo aparecerán aquí." />
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filas.map((f) => (
            <Card key={f.usuario.id}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="h-10 w-10 rounded-full bg-brand-light text-brand-blue flex items-center justify-center text-sm font-semibold">
                    {f.usuario.avatar}
                  </span>
                  <div>
                    <p className="font-semibold text-navy text-sm">{f.usuario.nombre}</p>
                    <p className="text-xs text-slate-400">{f.usuario.puesto}</p>
                  </div>
                </div>
                <SemaforoDot semaforo={f.semaforo} conEtiqueta />
              </div>

              <div className="grid grid-cols-3 gap-2 text-center mb-3">
                <div className="bg-surface rounded-lg py-2">
                  <p className="text-lg font-bold text-navy flex items-center justify-center gap-1"><ListChecks size={14} className="text-brand-blue" />{f.totalAsignadas}</p>
                  <p className="text-[10px] text-slate-400 uppercase">Asignadas</p>
                </div>
                <div className="bg-surface rounded-lg py-2">
                  <p className={`text-lg font-bold flex items-center justify-center gap-1 ${f.vencidas > 0 ? "text-danger" : "text-navy"}`}><AlertTriangle size={14} />{f.vencidas}</p>
                  <p className="text-[10px] text-slate-400 uppercase">Vencidas</p>
                </div>
                <div className="bg-surface rounded-lg py-2">
                  <p className={`text-lg font-bold flex items-center justify-center gap-1 ${f.bloqueadas > 0 ? "text-danger" : "text-navy"}`}><Lock size={14} />{f.bloqueadas}</p>
                  <p className="text-[10px] text-slate-400 uppercase">Bloqueos</p>
                </div>
              </div>

              <p className="text-xs text-slate-500 mb-1">Avance promedio de sus actividades</p>
              <ProgressBar valor={f.avancePromedio} mostrarValor />

              <p className="text-[11px] text-slate-400 mt-3">
                Última actualización: {f.ultimaActualizacion ? formatFecha(f.ultimaActualizacion.slice(0, 10)) : "Sin registros"}
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MiEquipo() {
  return (
    <RoleGuard roles={["Lider"]}>
      <MiEquipoContenido />
    </RoleGuard>
  );
}
