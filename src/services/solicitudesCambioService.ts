import type { SolicitudCambio } from "../types";
import { solicitudesCambioSemilla } from "../data";
import { createCrudService } from "./createCrudService";

const base = createCrudService<SolicitudCambio>("solicitudesCambio", solicitudesCambioSemilla);

export const solicitudesCambioService = {
  ...base,
  aprobar(id: string, resueltoPor: string, fechaResolucion: string) {
    return base.update(id, { estatus: "Aprobada", resueltoPor, fechaResolucion });
  },
  rechazar(id: string, resueltoPor: string, fechaResolucion: string) {
    return base.update(id, { estatus: "Rechazada", resueltoPor, fechaResolucion });
  },
};
