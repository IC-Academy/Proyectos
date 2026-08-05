import type { Actividad } from "../types";
import { actividadesSemilla } from "../data";
import { createCrudService } from "./createCrudService";

export const actividadesService = createCrudService<Actividad>("actividades", actividadesSemilla);
