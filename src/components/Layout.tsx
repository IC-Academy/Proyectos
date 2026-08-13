import React from "react";
import { useApp } from "../context/AppContext";
import { Avatar } from "./ui";
import { NotificationCenter } from "./NotificationCenter";

export interface MenuItemDef {
  key: string;
  label: string;
  icon: string;
}

export const MENUS: Record<string, MenuItemDef[]> = {
  Administrador: [
    { key: "resumen", label: "Resumen", icon: "🏠" },
    { key: "usuarios", label: "Usuarios", icon: "👥" },
    { key: "areas", label: "Áreas", icon: "🏢" },
    { key: "periodos", label: "Periodos", icon: "🗓️" },
    { key: "configuracion", label: "Configuración", icon: "⚙️" },
    { key: "aprobaciones", label: "Aprobaciones", icon: "✅" },
    { key: "bitacora", label: "Bitácora", icon: "📜" },
    { key: "edd", label: "Integración EDD", icon: "🔗" },
  ],
  Direccion: [
    { key: "resumen", label: "Resumen ejecutivo", icon: "📊" },
    { key: "objetivos", label: "Objetivos estratégicos", icon: "🎯" },
    { key: "cascada", label: "Cascada", icon: "🌊" },
    { key: "gantt", label: "Gantt", icon: "📅" },
    { key: "alertas", label: "Alertas", icon: "🚨" },
    { key: "evidencias", label: "Evidencias", icon: "📎" },
  ],
  Lider: [
    { key: "mis-objetivos", label: "Mis objetivos", icon: "🎯" },
    { key: "proyectos", label: "Proyectos del área", icon: "📁" },
    { key: "equipo", label: "Mi equipo", icon: "👥" },
    { key: "actividades", label: "Actividades", icon: "📋" },
    { key: "solicitudes", label: "Solicitudes", icon: "🔁" },
    { key: "aprobaciones", label: "Aprobaciones", icon: "✅" },
    { key: "gantt", label: "Gantt", icon: "📅" },
  ],
  Colaborador: [
    { key: "resumen", label: "Mi resumen", icon: "🏠" },
    { key: "mis-objetivos", label: "Mis objetivos", icon: "🎯" },
    { key: "mis-actividades", label: "Mis actividades", icon: "📋" },
    { key: "mi-plan", label: "Mi plan", icon: "🗂️" },
    { key: "evidencias", label: "Evidencias", icon: "📎" },
    { key: "solicitudes", label: "Solicitudes", icon: "🔁" },
  ],
};

const ROL_LABEL: Record<string, string> = {
  Administrador: "Administrador",
  Direccion: "Dirección",
  Lider: "Líder de área",
  Colaborador: "Colaborador",
};

export function Layout({
  activeKey,
  onNavigate,
  title,
  subtitle,
  children,
  onNavigateEntidad,
}: {
  activeKey: string;
  onNavigate: (key: string) => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onNavigateEntidad?: (tipo: string, id: string) => void;
}) {
  const { usuarioActual, logout, db } = useApp();
  if (!usuarioActual) return null;
  const menu = MENUS[usuarioActual.rol] ?? [];
  const areaNombre = db.areas.find((a) => a.areaId === usuarioActual.areaId)?.nombre ?? "";

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-mark">IC</div>
          <div className="sidebar-brand-text">
            INTER-CON
            <small>Objetivos en Cascada</small>
          </div>
        </div>
        <div className="sidebar-section-label">{ROL_LABEL[usuarioActual.rol]}</div>
        <nav>
          {menu.map((item) => (
            <button key={item.key} className={`nav-item ${activeKey === item.key ? "active" : ""}`} onClick={() => onNavigate(item.key)}>
              <span className="ic">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <Avatar nombre={usuarioActual.nombre} />
            <div className="sidebar-user-info">
              <b>{usuarioActual.nombre}</b>
              <span>{areaNombre}</span>
            </div>
          </div>
          <button className="btn btn-secondary btn-block logout-btn btn-sm" onClick={logout}>
            Cerrar sesión
          </button>
        </div>
      </aside>
      <div className="main-col">
        <header className="topbar">
          <div>
            <div className="topbar-title">{title}</div>
            {subtitle && <div className="topbar-sub">{subtitle}</div>}
          </div>
          <div className="topbar-actions">
            <NotificationCenter onNavigateEntidad={onNavigateEntidad} />
          </div>
        </header>
        <main className="content">{children}</main>
      </div>
    </div>
  );
}
