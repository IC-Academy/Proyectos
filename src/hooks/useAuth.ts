import { useApp } from "../context/AppContext";

/** Helper de conveniencia sobre el contexto de la app para lógica de roles. */
export function useAuth() {
  const { usuarioActual, login, logout, usuarios } = useApp();
  return {
    usuario: usuarioActual,
    estaAutenticado: !!usuarioActual,
    esDirector: usuarioActual?.rol === "Director",
    esLider: usuarioActual?.rol === "Lider",
    esColaborador: usuarioActual?.rol === "Colaborador",
    login,
    logout,
    usuarios,
  };
}
