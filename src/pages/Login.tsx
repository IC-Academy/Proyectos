import React, { useState } from "react";
import { useApp } from "../context/AppContext";

const CUENTAS_DEMO = [
  { correo: "gabriel@demo.com", rol: "Dirección", area: "Dirección General" },
  { correo: "daniela@demo.com", rol: "Líder", area: "Ventas" },
  { correo: "dante@demo.com", rol: "Colaborador", area: "Ventas" },
  { correo: "jorge@demo.com", rol: "Administrador", area: "Inteligencia de Negocios" },
];

export function Login() {
  const { login } = useApp();
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  function intentar(e?: React.FormEvent) {
    e?.preventDefault();
    const res = login(correo, password);
    if (!res.ok) setError(res.error ?? "No se pudo iniciar sesión.");
    else setError(null);
  }

  return (
    <div className="login-screen">
      <div className="login-visual">
        <div className="login-brand">
          <div className="login-brand-mark">IC</div>
          <div className="login-brand-text">INTER-CON</div>
        </div>
        <div>
          <h1>Portal Corporativo de Objetivos en Cascada</h1>
          <p style={{ marginTop: 14 }}>
            Convierte los objetivos estratégicos de Dirección en proyectos, actividades y subactividades ejecutables — e identifica
            exactamente en qué área, actividad o persona se está deteniendo el cumplimiento.
          </p>
        </div>
        <div className="login-cascade-preview">
          <div className="login-cascade-row"><span className="login-cascade-dot" /> Objetivo estratégico</div>
          <div className="login-cascade-row"><span className="login-cascade-dot" /> Participación de áreas</div>
          <div className="login-cascade-row"><span className="login-cascade-dot" /> Proyecto o meta del líder</div>
          <div className="login-cascade-row"><span className="login-cascade-dot" /> Actividad asignada</div>
          <div className="login-cascade-row"><span className="login-cascade-dot" /> Subactividades del colaborador</div>
          <div className="login-cascade-row"><span className="login-cascade-dot" /> Evidencias → Avance calculado → Resultado consolidado</div>
        </div>
      </div>
      <div className="login-panel">
        <div className="login-form-card">
          <h2>Iniciar sesión</h2>
          <p className="sub">Accede con tu cuenta corporativa de demostración.</p>
          {error && <div className="login-error">{error}</div>}
          <form onSubmit={intentar}>
            <div className="field">
              <label>Correo corporativo</label>
              <input type="email" placeholder="nombre@demo.com" value={correo} onChange={(e) => setCorreo(e.target.value)} autoFocus />
            </div>
            <div className="field">
              <label>Contraseña</label>
              <input type="password" placeholder="••••" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <button className="btn btn-primary btn-block" type="submit">
              Entrar al portal
            </button>
          </form>
          <div className="demo-accounts">
            <div className="title">Accesos de prueba (contraseña: 1234)</div>
            {CUENTAS_DEMO.map((c) => (
              <button
                key={c.correo}
                className="demo-account-btn"
                onClick={() => {
                  setCorreo(c.correo);
                  setPassword("1234");
                  setError(null);
                }}
              >
                <span>
                  <b>{c.correo}</b>
                  <span>{c.area}</span>
                </span>
                <span className="badge badge-blue">{c.rol}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
