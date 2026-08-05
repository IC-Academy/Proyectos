import { readValue, writeValue } from "./storage";

// Las alertas se calculan en vivo (ver utils/alertsEngine.ts) a partir del estado
// actual de la aplicación; aquí solo persistimos qué ids de alerta ya fueron
// marcadas como leídas por el usuario, ya que los ids son deterministas.
const KEY = "alertasLeidas";

export const alertasService = {
  getLeidas(): string[] {
    return readValue<string[]>(KEY, []);
  },
  marcarLeida(id: string) {
    const actuales = new Set(this.getLeidas());
    actuales.add(id);
    writeValue(KEY, Array.from(actuales));
  },
  marcarNoLeida(id: string) {
    const actuales = new Set(this.getLeidas());
    actuales.delete(id);
    writeValue(KEY, Array.from(actuales));
  },
  marcarTodasLeidas(ids: string[]) {
    const actuales = new Set(this.getLeidas());
    ids.forEach((id) => actuales.add(id));
    writeValue(KEY, Array.from(actuales));
  },
  reset() {
    writeValue(KEY, []);
  },
};
