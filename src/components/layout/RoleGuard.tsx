import React from "react";
import type { Rol } from "../../types";
import { useAuth } from "../../hooks/useAuth";
import { EmptyState } from "../common/EmptyState";
import { ShieldAlert } from "lucide-react";

export function RoleGuard({ roles, children }: { roles: Rol[]; children: React.ReactNode }) {
  const { usuario } = useAuth();
  if (!usuario || !roles.includes(usuario.rol)) {
    return (
      <div className="bg-white rounded-xl shadow-card border border-slate-100">
        <EmptyState
          icono={ShieldAlert}
          titulo="No tienes acceso a esta sección"
          mensaje="Esta vista no está disponible para tu perfil actual. Cambia de perfil desde el encabezado si necesitas revisarla."
        />
      </div>
    );
  }
  return <>{children}</>;
}
