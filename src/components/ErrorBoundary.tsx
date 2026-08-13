import React from "react";
import { resetDatabase, saveSessionUserId } from "../services/storage";

interface State {
  error: Error | null;
}

// La aplicación nunca debe quedar en blanco por un error inesperado o datos
// corruptos en localStorage: este límite de error ofrece una recuperación segura.
export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[icportal] Error no controlado:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="login-screen" style={{ gridTemplateColumns: "1fr" }}>
          <div className="login-panel">
            <div className="login-form-card">
              <h2>Ocurrió un problema al mostrar el portal</h2>
              <p className="sub">Esto puede deberse a datos locales corruptos. Puedes restablecer los datos de demostración de forma segura sin perder acceso a la aplicación.</p>
              <div className="login-error">{this.state.error.message}</div>
              <button
                className="btn btn-primary btn-block"
                onClick={() => {
                  resetDatabase();
                  saveSessionUserId(null);
                  window.location.reload();
                }}
              >
                Restablecer datos y recargar
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
