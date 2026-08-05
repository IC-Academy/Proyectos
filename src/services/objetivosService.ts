import type { Objetivo } from "../types";
import { objetivosSemilla } from "../data";
import { createCrudService } from "./createCrudService";

export const objetivosService = createCrudService<Objetivo>("objetivos", objetivosSemilla);
