import { readValue, writeValue } from "./storage";

const KEY = "sesionUsuarioId";

export const sesionService = {
  getUsuarioActualId(): string | null {
    return readValue<string | null>(KEY, null);
  },
  setUsuarioActualId(id: string | null) {
    writeValue(KEY, id);
  },
};
