import React, { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";
import type { DemoDatabase, Usuario } from "../types";
import { store } from "../services/store";
import { loadSessionUserId, saveSessionUserId } from "../services/storage";

interface AppContextValue {
  db: DemoDatabase;
  usuarioActual: Usuario | null;
  login: (correo: string, password: string) => { ok: boolean; error?: string };
  logout: () => void;
  store: typeof store;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const db = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  const [sessionUserId, setSessionUserId] = React.useState<string | null>(() => loadSessionUserId());

  const usuarioActual = useMemo(() => {
    if (!sessionUserId) return null;
    return db.usuarios.find((u) => u.usuarioId === sessionUserId) ?? null;
  }, [db, sessionUserId]);

  const login = useCallback((correo: string, password: string) => {
    const u = store.intentarLogin(correo, password);
    if (!u) return { ok: false, error: "Correo o contraseña incorrectos." };
    saveSessionUserId(u.usuarioId);
    setSessionUserId(u.usuarioId);
    return { ok: true };
  }, []);

  const logout = useCallback(() => {
    saveSessionUserId(null);
    setSessionUserId(null);
  }, []);

  const value = useMemo<AppContextValue>(() => ({ db, usuarioActual, login, logout, store }), [db, usuarioActual, login, logout]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp debe usarse dentro de <AppProvider>");
  return ctx;
}
