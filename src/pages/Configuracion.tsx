import React, { useState } from "react";
import { RotateCcw, Info, ShieldCheck } from "lucide-react";
import { useApp } from "../context/AppContext";
import { useAuth } from "../hooks/useAuth";
import { PageHeader } from "../components/common/PageHeader";
import { Card } from "../components/common/Card";
import { Button } from "../components/common/Button";
import { ConfirmDialog } from "../components/common/ConfirmDialog";

export default function Configuracion() {
  const { usuario } = useAuth();
  const { restablecerDatos } = useApp();
  const [confirmando, setConfirmando] = useState(false);

  return (
    <div>
      <PageHeader titulo="Configuración" subtitulo="Preferencias y administración de los datos de demostración" />

      <div className="grid md:grid-cols-2 gap-4">
        <Card title="Tu perfil activo">
          <div className="flex items-center gap-3 mb-3">
            <span className="h-12 w-12 rounded-full bg-brand-light text-brand-blue flex items-center justify-center text-sm font-semibold">{usuario?.avatar}</span>
            <div>
              <p className="font-semibold text-navy">{usuario?.nombre}</p>
              <p className="text-xs text-slate-400">{usuario?.puesto} · {usuario?.rol}</p>
            </div>
          </div>
          <p className="text-xs text-slate-500">Puedes cambiar de perfil de demostración desde el menú del encabezado (esquina superior derecha).</p>
        </Card>

        <Card title="Acerca de esta beta">
          <div className="flex items-start gap-2 text-sm text-slate-600">
            <Info size={16} className="mt-0.5 shrink-0 text-brand-blue" />
            <p>
              Esta es una beta funcional y navegable del portal de objetivos en cascada. Todos los datos se almacenan localmente en tu navegador
              (LocalStorage) y no se envían a ningún servidor. El objetivo es validar el flujo operativo antes de construir el backend definitivo en
              Microsoft Dataverse, Power Apps y Power Automate.
            </p>
          </div>
        </Card>

        <Card title="Restablecer datos de demostración" className="md:col-span-2">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-2 max-w-2xl">
              <ShieldCheck size={16} className="mt-0.5 shrink-0 text-amber-500" />
              <p className="text-sm text-slate-600">
                Esta acción elimina todos los cambios realizados durante la sesión (objetivos, actividades, avances, delegaciones, bloqueos, evidencias y
                alertas leídas) y vuelve a cargar el set de datos de demostración original.
              </p>
            </div>
            <Button variante="peligro" onClick={() => setConfirmando(true)}>
              <RotateCcw size={14} /> Restablecer datos de demostración
            </Button>
          </div>
        </Card>
      </div>

      <ConfirmDialog
        abierto={confirmando}
        titulo="¿Restablecer datos de demostración?"
        mensaje="Se perderán todos los cambios realizados en esta sesión. Esta acción no se puede deshacer."
        onConfirmar={() => {
          restablecerDatos();
          setConfirmando(false);
        }}
        onCancelar={() => setConfirmando(false)}
        textoConfirmar="Sí, restablecer"
        peligroso
      />
    </div>
  );
}
