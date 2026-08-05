import React, { useMemo, useState } from "react";
import { CheckCircle2, XCircle, ClipboardCheck } from "lucide-react";
import { useApp } from "../context/AppContext";
import { useAuth } from "../hooks/useAuth";
import { PageHeader } from "../components/common/PageHeader";
import { Card } from "../components/common/Card";
import { Badge } from "../components/common/Badge";
import { Button } from "../components/common/Button";
import { EmptyState } from "../components/common/EmptyState";
import { Modal } from "../components/common/Modal";
import { TextArea, Field } from "../components/common/Field";
import { RoleGuard } from "../components/layout/RoleGuard";
import { formatFecha } from "../utils/dates";
import type { TipoAprobacion } from "../types";

interface FilaAprobacion {
  id: string;
  origenId: string;
  tipo: TipoAprobacion;
  solicitante: string;
  elemento: string;
  fecha: string;
  valorAnterior: string;
  valorPropuesto: string;
  motivo: string;
  evidencia?: string;
  onAprobar: () => void;
  onRechazar: (motivo?: string) => void;
}

function AprobacionesContenido() {
  const { usuario } = useAuth();
  const {
    actualizaciones,
    delegaciones,
    solicitudesCambio,
    actividades,
    objetivos,
    usuarios,
    getUsuario,
    aprobarActualizacion,
    rechazarActualizacion,
    aprobarDelegacion,
    rechazarDelegacion,
    aprobarSolicitudCambio,
    rechazarSolicitudCambio,
  } = useApp();

  const [filtroTipo, setFiltroTipo] = useState<string>("Todos");
  const [rechazoActivo, setRechazoActivo] = useState<{ fila: FilaAprobacion } | null>(null);
  const [motivoRechazo, setMotivoRechazo] = useState("");

  if (!usuario) return null;

  const esMiEquipo = (usuarioId?: string) => {
    if (usuario.rol === "Director") return true;
    const u = usuarios.find((x) => x.id === usuarioId);
    return u?.liderId === usuario.id;
  };

  const filas: FilaAprobacion[] = useMemo(() => {
    const out: FilaAprobacion[] = [];

    actualizaciones
      .filter((u) => u.estatusValidacion === "Pendiente")
      .forEach((u) => {
        if (!esMiEquipo(u.usuarioId)) return;
        const elemento = actividades.find((a) => a.id === u.elementoId) || objetivos.find((o) => o.id === u.elementoId);
        out.push({
          id: `upd-${u.id}`,
          origenId: u.id,
          tipo: "Validación de avance",
          solicitante: getUsuario(u.usuarioId)?.nombre ?? u.usuarioId,
          elemento: elemento?.nombre ?? u.elementoId,
          fecha: u.fecha,
          valorAnterior: `${u.avanceAnterior}%`,
          valorPropuesto: `${u.avanceNuevo}%`,
          motivo: u.comentario,
          evidencia: u.evidencia,
          onAprobar: () => aprobarActualizacion(u.id, usuario.id),
          onRechazar: (motivo) => rechazarActualizacion(u.id, usuario.id, motivo || "Sin motivo especificado"),
        });
      });

    delegaciones
      .filter((d) => d.estatus === "Pendiente")
      .forEach((d) => {
        if (!esMiEquipo(d.usuarioOrigenId)) return;
        const act = actividades.find((a) => a.id === d.actividadId);
        out.push({
          id: `del-${d.id}`,
          origenId: d.id,
          tipo: "Delegación",
          solicitante: getUsuario(d.usuarioOrigenId)?.nombre ?? d.usuarioOrigenId,
          elemento: act?.nombre ?? d.actividadId,
          fecha: d.fechaSolicitud,
          valorAnterior: getUsuario(d.usuarioOrigenId)?.nombre ?? "-",
          valorPropuesto: getUsuario(d.usuarioDestinoId)?.nombre ?? "-",
          motivo: d.motivo,
          onAprobar: () => aprobarDelegacion(d.id, usuario.id),
          onRechazar: () => rechazarDelegacion(d.id, usuario.id),
        });
      });

    solicitudesCambio
      .filter((s) => s.estatus === "Pendiente")
      .forEach((s) => {
        const esObjetivo = s.tipoElemento === "objetivo";
        if (esObjetivo && usuario.rol !== "Director") return;
        if (!esObjetivo && !esMiEquipo(s.solicitadoPor)) return;
        const elemento = s.tipoElemento === "actividad" ? actividades.find((a) => a.id === s.elementoId) : objetivos.find((o) => o.id === s.elementoId);
        out.push({
          id: `sc-${s.id}`,
          origenId: s.id,
          tipo: s.tipo === "Cambio de fecha" ? "Cambio de fecha" : s.tipo === "Cambio de responsable" ? "Cambio de responsable" : "Cambio de alcance",
          solicitante: getUsuario(s.solicitadoPor)?.nombre ?? s.solicitadoPor,
          elemento: elemento?.nombre ?? s.elementoId,
          fecha: s.fechaSolicitud,
          valorAnterior: s.valorAnterior,
          valorPropuesto: s.valorSolicitado,
          motivo: s.motivo,
          onAprobar: () => aprobarSolicitudCambio(s.id, usuario.id),
          onRechazar: () => rechazarSolicitudCambio(s.id, usuario.id),
        });
      });

    return out.sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actualizaciones, delegaciones, solicitudesCambio, usuario.id, usuario.rol]);

  const filtradas = filtroTipo === "Todos" ? filas : filas.filter((f) => f.tipo === filtroTipo);
  const tipos = Array.from(new Set(filas.map((f) => f.tipo)));

  function confirmarRechazo() {
    if (!rechazoActivo) return;
    rechazoActivo.fila.onRechazar(motivoRechazo.trim());
    setRechazoActivo(null);
    setMotivoRechazo("");
  }

  return (
    <div>
      <PageHeader titulo="Aprobaciones" subtitulo="Valida avances, delegaciones y solicitudes de cambio pendientes" />

      <div className="flex gap-2 mb-4 flex-wrap">
        <Button tamano="sm" variante={filtroTipo === "Todos" ? "primario" : "secundario"} onClick={() => setFiltroTipo("Todos")}>
          Todos ({filas.length})
        </Button>
        {tipos.map((t) => (
          <Button key={t} tamano="sm" variante={filtroTipo === t ? "primario" : "secundario"} onClick={() => setFiltroTipo(t)}>
            {t} ({filas.filter((f) => f.tipo === t).length})
          </Button>
        ))}
      </div>

      {filtradas.length === 0 ? (
        <Card>
          <EmptyState icono={ClipboardCheck} titulo="No hay solicitudes pendientes" mensaje="Cuando tu equipo registre avances, delegaciones o cambios, aparecerán aquí." />
        </Card>
      ) : (
        <div className="space-y-3">
          {filtradas.map((f) => (
            <Card key={f.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Badge className="bg-brand-light text-brand-blue border border-blue-200">{f.tipo}</Badge>
                    <span className="text-xs text-slate-400">{formatFecha(f.fecha)}</span>
                  </div>
                  <p className="font-semibold text-navy text-sm">{f.elemento}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Solicitado por {f.solicitante}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
                    <span className="line-through text-slate-400">{f.valorAnterior}</span>
                    <span>→</span>
                    <span className="text-navy font-medium">{f.valorPropuesto}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-2 italic">"{f.motivo}"</p>
                  {f.evidencia && <p className="text-xs text-brand-blue mt-1">Evidencia adjunta: {f.evidencia}</p>}
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button tamano="sm" variante="exito" onClick={f.onAprobar}>
                    <CheckCircle2 size={14} /> Aprobar
                  </Button>
                  <Button tamano="sm" variante="peligro" onClick={() => setRechazoActivo({ fila: f })}>
                    <XCircle size={14} /> Rechazar
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        abierto={!!rechazoActivo}
        onClose={() => setRechazoActivo(null)}
        titulo="Motivo del rechazo"
        footer={
          <>
            <Button variante="secundario" onClick={() => setRechazoActivo(null)}>
              Cancelar
            </Button>
            <Button variante="peligro" onClick={confirmarRechazo}>
              Confirmar rechazo
            </Button>
          </>
        }
      >
        <Field label="Motivo" required>
          <TextArea rows={3} value={motivoRechazo} onChange={(e) => setMotivoRechazo(e.target.value)} placeholder="Explica por qué se rechaza esta solicitud..." />
        </Field>
      </Modal>
    </div>
  );
}

export default function Aprobaciones() {
  return (
    <RoleGuard roles={["Director", "Lider"]}>
      <AprobacionesContenido />
    </RoleGuard>
  );
}
