import type { Evidencia } from "../types";
import { evidenciasSemilla } from "../data";
import { createCrudService } from "./createCrudService";

const base = createCrudService<Evidencia>("evidencias", evidenciasSemilla);

export const evidenciasService = {
  ...base,
  validar(id: string) {
    return base.update(id, { estatusValidacion: "Validado" });
  },
  rechazar(id: string) {
    return base.update(id, { estatusValidacion: "Rechazado" });
  },
};
