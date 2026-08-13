import React from "react";
import { type ColorBadge, colorPorEstado, colorPorPrioridad, iniciales } from "../utils/badges";

// ============================================================================
// Componentes de interfaz compartidos (tarjetas, badges, progreso, modal...)
// Este archivo solo exporta componentes: los helpers puros (formato de fecha,
// colores de estatus, iniciales) viven en src/utils/ para no romper el fast
// refresh de React y mantener cada archivo enfocado en un único propósito.
// ============================================================================

export function Badge({ children, color = "gray" }: { children: React.ReactNode; color?: ColorBadge }) {
  return <span className={`badge badge-${color}`}>{children}</span>;
}

export function EstadoBadge({ estado }: { estado: string }) {
  return <Badge color={colorPorEstado(estado)}>{estado}</Badge>;
}

export function PrioridadBadge({ prioridad }: { prioridad: string }) {
  return <Badge color={colorPorPrioridad(prioridad)}>{prioridad}</Badge>;
}

export function ProgressBar({ value, colorClass }: { value: number; colorClass?: "green" | "yellow" | "red" | "purple" }) {
  const v = Math.max(0, Math.min(100, value));
  const auto = colorClass ?? (v >= 100 ? "green" : v < 40 ? "red" : v < 70 ? "yellow" : undefined);
  return (
    <div className="progress-row">
      <div className="progress-track">
        <div className={`progress-fill ${auto ?? ""}`} style={{ width: `${v}%` }} />
      </div>
      <span className="pct">{Math.round(v)}%</span>
    </div>
  );
}

export function KPICard({ label, value, accent, delta }: { label: string; value: React.ReactNode; accent?: "blue" | "green" | "red" | "yellow" | "purple"; delta?: { text: string; positive: boolean } }) {
  return (
    <div className={`kpi-card ${accent ? `accent-${accent}` : ""}`}>
      <div className="label">{label}</div>
      <div className="value">{value}</div>
      {delta && <div className={`delta ${delta.positive ? "up" : "down"}`}>{delta.text}</div>}
    </div>
  );
}

export function ComingSoon({ label = "Disponible en fase productiva" }: { label?: string }) {
  return <span className="coming-soon" title="Esta función se conectará en la siguiente fase (fuera del alcance local de esta demo).">🔒 {label}</span>;
}

export function EmptyState({ icon = "📋", title, sub }: { icon?: string; title: string; sub?: string }) {
  return (
    <div className="empty-state">
      <div className="ic">{icon}</div>
      <div style={{ fontWeight: 700, marginBottom: 4 }}>{title}</div>
      {sub && <div className="small-text">{sub}</div>}
    </div>
  );
}

export function Avatar({ nombre, size = "md" }: { nombre: string; size?: "md" | "sm" }) {
  return <div className={size === "sm" ? "avatar-sm" : "avatar"}>{iniciales(nombre)}</div>;
}

export function Modal({
  open,
  onClose,
  title,
  sub,
  children,
  footer,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  sub?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`modal-box ${wide ? "wide" : ""}`}>
        <div className="modal-header">
          <div>
            <h3>{title}</h3>
            {sub && <p>{sub}</p>}
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

export function AlertBox({ tipo, children }: { tipo: "warn" | "error" | "info" | "success"; children: React.ReactNode }) {
  const icon = { warn: "⚠️", error: "⛔", info: "ℹ️", success: "✅" }[tipo];
  return (
    <div className={`alert-box ${tipo}`}>
      <span>{icon}</span>
      <div>{children}</div>
    </div>
  );
}
