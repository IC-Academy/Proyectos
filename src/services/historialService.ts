import type { HistorialEvento } from "../types";
import { createCrudService } from "./createCrudService";

export const historialService = createCrudService<HistorialEvento>("historial", []);
