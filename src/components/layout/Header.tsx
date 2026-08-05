import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, ChevronDown, LogOut } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useAuth } from "../../hooks/useAuth";

export function Header() {
  const { usuario, usuarios, login, logout } = useAuth();
  const { alertasVisibles } = useApp();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const navigate = useNavigate();

  if (!usuario) return null;
  const noLeidas = alertasVisibles.filter((a) => !a.leida).length;

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="text-sm text-slate-400">Portal de Objetivos Estratégicos</div>
      <div className="flex items-center gap-4">
        <button onClick={() => navigate("/alertas")} className="relative rounded-lg p-2 hover:bg-slate-100 text-slate-500" aria-label="Notificaciones">
          <Bell size={18} />
          {noLeidas > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-danger text-white text-[10px] font-semibold rounded-full h-4 min-w-4 px-1 flex items-center justify-center">
              {noLeidas}
            </span>
          )}
        </button>

        <div className="relative">
          <button onClick={() => setMenuAbierto((v) => !v)} className="flex items-center gap-2 rounded-lg pl-1 pr-2 py-1 hover:bg-slate-100">
            <span className="h-8 w-8 rounded-full bg-brand-light text-brand-blue flex items-center justify-center text-xs font-semibold">
              {usuario.avatar}
            </span>
            <span className="text-left leading-tight hidden sm:block">
              <span className="block text-sm font-medium text-navy">{usuario.nombre}</span>
              <span className="block text-[11px] text-slate-400">{usuario.puesto}</span>
            </span>
            <ChevronDown size={14} className="text-slate-400" />
          </button>

          {menuAbierto && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setMenuAbierto(false)} />
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-soft border border-slate-100 z-40 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-xs text-slate-400">Rol activo</p>
                  <p className="text-sm font-medium text-navy">{usuario.rol}</p>
                </div>
                <div className="px-4 py-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wide pt-3">Cambiar perfil de demostración</div>
                <div className="max-h-64 overflow-y-auto">
                  {usuarios.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => {
                        login(u.id);
                        setMenuAbierto(false);
                        navigate("/inicio");
                      }}
                      className={`w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-surface text-sm ${u.id === usuario.id ? "bg-brand-light/40" : ""}`}
                    >
                      <span className="h-7 w-7 rounded-full bg-brand-light text-brand-blue flex items-center justify-center text-[11px] font-semibold shrink-0">
                        {u.avatar}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate">{u.nombre}</span>
                        <span className="block text-[11px] text-slate-400 truncate">{u.puesto}</span>
                      </span>
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => {
                    logout();
                    navigate("/");
                  }}
                  className="w-full flex items-center gap-2 px-4 py-3 text-left text-sm text-danger hover:bg-red-50 border-t border-slate-100"
                >
                  <LogOut size={15} /> Cerrar sesión
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
