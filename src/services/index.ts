export { usuariosService } from "./usuariosService";
export { objetivosService } from "./objetivosService";
export { actividadesService } from "./actividadesService";
export { actualizacionesService } from "./actualizacionesService";
export { delegacionesService } from "./delegacionesService";
export { evidenciasService } from "./evidenciasService";
export { bloqueosService } from "./bloqueosService";
export { solicitudesCambioService } from "./solicitudesCambioService";
export { historialService } from "./historialService";
export { alertasService } from "./alertasService";
export { sesionService } from "./sesionService";
export { clearAllPortalData } from "./storage";

import { clearAllPortalData } from "./storage";
import { objetivosService } from "./objetivosService";
import { actividadesService } from "./actividadesService";
import { actualizacionesService } from "./actualizacionesService";
import { delegacionesService } from "./delegacionesService";
import { evidenciasService } from "./evidenciasService";
import { bloqueosService } from "./bloqueosService";
import { solicitudesCambioService } from "./solicitudesCambioService";
import { historialService } from "./historialService";
import { usuariosService } from "./usuariosService";
import { alertasService } from "./alertasService";
import { sesionService } from "./sesionService";

/** Restablece por completo los datos de demostración a su estado inicial. */
export function restablecerDatosDemo(): void {
  clearAllPortalData();
  // Forzar recarga de semillas la próxima vez que se solicite cada colección.
  usuariosService.reset();
  objetivosService.reset();
  actividadesService.reset();
  actualizacionesService.reset();
  delegacionesService.reset();
  evidenciasService.reset();
  bloqueosService.reset();
  solicitudesCambioService.reset();
  historialService.reset();
  alertasService.reset();
  sesionService.setUsuarioActualId(null);
}
