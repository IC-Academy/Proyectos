import type { DemoDatabase } from "../types";
import { buildSeedDatabase, DB_VERSION } from "../data/seed";

// ============================================================================
// Capa de persistencia local (localStorage), versionada y con recuperación
// segura ante datos corruptos. La aplicación NUNCA debe quedar en blanco por
// un error de localStorage: cualquier fallo cae de vuelta a los datos demo.
// ============================================================================

const STORAGE_KEY = "icportal:v" + DB_VERSION + ":db";
const SESSION_KEY = "icportal:v" + DB_VERSION + ":session";
const LEGACY_PREFIX = "icportal:"; // limpia versiones previas incompatibles

export function loadDatabase(): { db: DemoDatabase; recuperado: boolean } {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const fresh = buildSeedDatabase();
      persistDatabase(fresh);
      return { db: fresh, recuperado: false };
    }
    const parsed = JSON.parse(raw) as DemoDatabase;
    if (!parsed || typeof parsed !== "object" || parsed.version !== DB_VERSION || !Array.isArray(parsed.usuarios)) {
      throw new Error("Estructura de datos local incompatible o corrupta.");
    }
    return { db: parsed, recuperado: false };
  } catch (err) {
    console.warn("[icportal] No se pudo leer localStorage, se restauran datos demo.", err);
    clearAllLegacyKeys();
    const fresh = buildSeedDatabase();
    try {
      persistDatabase(fresh);
    } catch {
      /* almacenamiento no disponible: se continúa solo en memoria */
    }
    return { db: fresh, recuperado: true };
  }
}

export function persistDatabase(db: DemoDatabase): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch (err) {
    console.error("[icportal] No se pudo guardar en localStorage.", err);
  }
}

export function resetDatabase(): DemoDatabase {
  const fresh = buildSeedDatabase();
  persistDatabase(fresh);
  return fresh;
}

function clearAllLegacyKeys(): void {
  try {
    const toRemove: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith(LEGACY_PREFIX)) toRemove.push(key);
    }
    toRemove.forEach((k) => window.localStorage.removeItem(k));
  } catch {
    /* no-op */
  }
}

// ---------------------------------------------------------------------------
// Sesión local (usuario autenticado)
// ---------------------------------------------------------------------------
export function loadSessionUserId(): string | null {
  try {
    return window.localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

export function saveSessionUserId(usuarioId: string | null): void {
  try {
    if (usuarioId) window.localStorage.setItem(SESSION_KEY, usuarioId);
    else window.localStorage.removeItem(SESSION_KEY);
  } catch {
    /* no-op */
  }
}
