import { createContext } from "react";
import type { DemoDatabase, Usuario } from "../types";
import type { store } from "../services/store";

// Definición del contexto separada de los componentes/hooks que lo usan,
// para que cada archivo de React Fast Refresh exporte un único tipo de cosa
// (solo componentes en AppContext.tsx, solo el hook en useApp.ts).
export interface AppContextValue {
  db: DemoDatabase;
  usuarioActual: Usuario | null;
  login: (correo: string, password: string) => { ok: boolean; error?: string };
  logout: () => void;
  store: typeof store;
}

export const AppContext = createContext<AppContextValue | null>(null);
