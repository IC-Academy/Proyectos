// Capa mínima de persistencia sobre LocalStorage.
// En una futura integración con Dataverse, este archivo es el único punto
// que debe sustituirse por llamadas HTTP (Dataverse Web API / Power Automate).

const PREFIX = "portalObjetivos:v1:";

export function storageKey(name: string): string {
  return `${PREFIX}${name}`;
}

export function readCollection<T>(name: string, seed: T[]): T[] {
  try {
    const raw = localStorage.getItem(storageKey(name));
    if (!raw) {
      localStorage.setItem(storageKey(name), JSON.stringify(seed));
      return seed;
    }
    return JSON.parse(raw) as T[];
  } catch {
    return seed;
  }
}

export function writeCollection<T>(name: string, data: T[]): void {
  localStorage.setItem(storageKey(name), JSON.stringify(data));
}

export function readValue<T>(name: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(storageKey(name));
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeValue<T>(name: string, value: T): void {
  localStorage.setItem(storageKey(name), JSON.stringify(value));
}

export function clearAllPortalData(): void {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(PREFIX)) keys.push(k);
  }
  keys.forEach((k) => localStorage.removeItem(k));
}
