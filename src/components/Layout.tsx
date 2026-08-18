import React from "react";
import { useApp } from "../context/useApp";
import { Avatar } from "./ui";
import { NotificationCenter } from "./NotificationCenter";
import { MENUS, ROL_LABEL } from "./menus";

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
  const menuBase = MENUS[usuarioActual.rol] ?? [];
  const menu = [{ key: "cascada-organizacional", label: "Despliegue jerárquico", icon: "🧭" }, ...menuBase];
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
