import type { Bloqueo } from "../types";
import { bloqueosSemilla } from "../data";
import { createCrudService } from "./createCrudService";

const base = createCrudService<Bloqueo>("bloqueos", bloqueosSemilla);

export const bloqueosService = {
  ...base,
  resolver(id: string, fechaResolucion: string) {
    return base.update(id, { estatus: "Resuelto", fechaResolucion });
  },
  marcarEnAtencion(id: string) {
    return base.update(id, { estatus: "En atención" });
  },
};
