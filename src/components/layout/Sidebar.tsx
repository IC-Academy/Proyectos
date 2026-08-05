import React from "react";
import { NavLink } from "react-router-dom";
import { Target } from "lucide-react";
import { navPorRol } from "./navConfig";
import { useAuth } from "../../hooks/useAuth";

export function Sidebar() {
  const { usuario } = useAuth();
  if (!usuario) return null;
  const items = navPorRol(usuario.rol);

  return (
    <aside className="w-60 shrink-0 bg-navy text-white flex flex-col h-screen sticky top-0">
      <div className="flex items-center gap-2 px-5 h-16 border-b border-white/10">
        <div className="bg-white/10 rounded-lg p-1.5">
          <Target size={18} />
        </div>
        <div className="leading-tight">
          <p className="font-semibold text-sm">Portal de Objetivos</p>
          <p className="text-[11px] text-white/50">Gestión estratégica</p>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive ? "bg-white/10 text-white font-medium" : "text-white/70 hover:bg-white/5 hover:text-white"
              }`
            }
          >
            <item.icon size={16} />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="px-4 py-3 border-t border-white/10 text-[11px] text-white/40">
        Beta funcional · datos simulados
      </div>
    </aside>
  );
}
