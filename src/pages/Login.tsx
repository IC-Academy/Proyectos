import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Target, ShieldCheck, ArrowRight } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import {
  PERFIL_DIRECTOR,
  PERFIL_LIDER_OPERACIONES,
  PERFIL_LIDER_RH,
  PERFIL_COLABORADOR,
  PERFIL_COLABORADOR_DELEGADO,
} from "../data";

const PERFILES_DEMO = [
  { id: PERFIL_DIRECTOR, titulo: "Director", detalle: "Visión ejecutiva de toda la organización" },
  { id: PERFIL_LIDER_OPERACIONES, titulo: "Líder de Operaciones", detalle: "Gestiona iniciativas y actividades de su área" },
  { id: PERFIL_LIDER_RH, titulo: "Líder de Recursos Humanos", detalle: "Gestiona iniciativas y actividades de RH" },
  { id: PERFIL_COLABORADOR, titulo: "Colaborador", detalle: "Actualiza avances y compromisos propios" },
  { id: PERFIL_COLABORADOR_DELEGADO, titulo: "Colaborador delegado", detalle: "Recibe actividades delegadas de otro colaborador" },
];

export default function Login() {
  const { usuarios, login } = useAuth();
  const navigate = useNavigate();
  const [seleccionado, setSeleccionado] = useState(PERFIL_DIRECTOR);

  const usuarioSeleccionado = usuarios.find((u) => u.id === seleccionado);

  function ingresar() {
    login(seleccionado);
    navigate("/inicio");
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <div className="bg-navy text-white">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center gap-3">
          <div className="bg-white/10 rounded-lg p-2">
            <Target size={22} />
          </div>
          <div>
            <p className="font-semibold">Portal de Objetivos Estratégicos</p>
            <p className="text-xs text-white/50">Beta funcional · Gestión de objetivos en cascada</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-3xl bg-white rounded-xl shadow-soft border border-slate-100 overflow-hidden grid md:grid-cols-2">
          <div className="bg-navy text-white p-8 flex flex-col justify-between">
            <div>
              <h1 className="text-2xl font-bold leading-snug">Bienvenido(a) al portal de objetivos en cascada</h1>
              <p className="text-white/60 text-sm mt-3">
                Esta beta simula el flujo operativo completo: desde la creación de objetivos estratégicos por Dirección, hasta el
                registro de avances de cada colaborador, con validación, delegación y recálculo automático del avance consolidado.
              </p>
            </div>
            <div className="flex items-center gap-2 text-white/50 text-xs mt-8">
              <ShieldCheck size={16} />
              Selector de perfil solo para fines de demostración. No se requiere contraseña.
            </div>
          </div>

          <div className="p-8">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Selecciona un perfil de demostración</h2>
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {PERFILES_DEMO.map((p) => {
                const usuario = usuarios.find((u) => u.id === p.id);
                const activo = seleccionado === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setSeleccionado(p.id)}
                    className={`w-full text-left rounded-lg border px-3 py-2.5 flex items-center gap-3 transition-colors ${
                      activo ? "border-brand-blue bg-brand-light/50" : "border-slate-200 hover:bg-surface"
                    }`}
                  >
                    <span
                      className={`h-9 w-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
                        activo ? "bg-brand-blue text-white" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {usuario?.avatar}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-navy">{p.titulo}</span>
                      <span className="block text-[11px] text-slate-400 truncate">{usuario?.nombre} · {p.detalle}</span>
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={ingresar}
              className="mt-5 w-full bg-navy hover:bg-navy-dark text-white rounded-lg py-2.5 text-sm font-medium flex items-center justify-center gap-2 transition-colors"
            >
              Ingresar como {usuarioSeleccionado?.nombre}
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
