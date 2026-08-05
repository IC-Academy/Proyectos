import type { Usuario } from "../types";
import { usuariosSemilla } from "../data";
import { createCrudService } from "./createCrudService";

export const usuariosService = createCrudService<Usuario>("usuarios", usuariosSemilla);
