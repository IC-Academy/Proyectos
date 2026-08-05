import type { Delegacion } from "../types";
import { delegacionesSemilla } from "../data";
import { createCrudService } from "./createCrudService";

const base = createCrudService<Delegacion>("delegaciones", delegacionesSemilla);

export const delegacionesService = {
  ...base,
  aprobar(id: string, aprobadoPor: string, fechaResolucion: string) {
    return base.update(id, { estatus: "Aprobada", aprobadoPor, fechaResolucion });
  },
  rechazar(id: string, aprobadoPor: string, fechaResolucion: string) {
    return base.update(id, { estatus: "Rechazada", aprobadoPor, fechaResolucion });
  },
  cancelar(id: string, fechaResolucion: string) {
    return base.update(id, { estatus: "Cancelada", fechaResolucion });
  },
};
