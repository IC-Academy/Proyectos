import { useContext } from "react";
import { AppContext, type AppContextValue } from "./AppContextBase";

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp debe usarse dentro de <AppProvider>");
  return ctx;
}
