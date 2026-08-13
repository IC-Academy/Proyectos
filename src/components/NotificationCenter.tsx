import { useState } from "react";
import { useApp } from "../context/useApp";
import { formatoFechaHora } from "../utils/format";
import { useClickOutside } from "../utils/useClickOutside";

export function NotificationCenter({ onNavigateEntidad }: { onNavigateEntidad?: (tipo: string, id: string) => void }) {
  const { db, usuarioActual, store } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useClickOutside<HTMLDivElement>(() => setOpen(false));

  if (!usuarioActual) return null;
  const mias = db.notificaciones.filter((n) => n.usuarioId === usuarioActual.usuarioId).sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
  const noLeidas = mias.filter((n) => !n.leida).length;

  return (
    <div style={{ position: "relative" }} ref={ref}>
      <button className="icon-btn" onClick={() => setOpen((o) => !o)} title="Notificaciones">
        🔔
        {noLeidas > 0 && <span className="badge-dot" />}
      </button>
      {open && (
        <div className="notif-panel">
          <div className="notif-header">
            <h4>Notificaciones {noLeidas > 0 && <span className="tag-count">{noLeidas} nuevas</span>}</h4>
            {noLeidas > 0 && (
              <button className="link-btn" onClick={() => store.marcarTodasLeidas(usuarioActual.usuarioId)}>
                Marcar todas leídas
              </button>
            )}
          </div>
          {mias.length === 0 ? (
            <div className="empty-state">
              <div className="ic">🔕</div>
              <div>Sin notificaciones por ahora.</div>
            </div>
          ) : (
            mias.slice(0, 25).map((n) => (
              <div
                key={n.notificacionId}
                className={`notif-item ${!n.leida ? "unread" : ""}`}
                onClick={() => {
                  store.marcarNotificacionLeida(n.notificacionId);
                  onNavigateEntidad?.(n.entidadTipo, n.entidadId);
                  setOpen(false);
                }}
              >
                <span className={`dot ${n.leida ? "read" : ""}`} />
                <div className="txt">
                  <b>{n.titulo}</b>
                  <p>{n.mensaje}</p>
                  <span>{formatoFechaHora(n.fecha)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
