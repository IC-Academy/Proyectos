import type { Actualizacion } from "../types";
import { actualizacionesSemilla } from "../data";
import { createCrudService } from "./createCrudService";

const base = createCrudService<Actualizacion>("actualizaciones", actualizacionesSemilla);

export const actualizacionesService = {
  ...base,
  aprobar(id: string, validadoPor: string, fechaValidacion: string) {
    return base.update(id, { estatusValidacion: "Validado", validadoPor, fechaValidacion });
  },
  rechazar(id: string, validadoPor: string, fechaValidacion: string, motivoRechazo: string) {
    return base.update(id, { estatusValidacion: "Rechazado", validadoPor, fechaValidacion, motivoRechazo });
  },
};
