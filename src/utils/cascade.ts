import type { Objetivo, Actividad } from "../types";

export interface AdvertenciaPeso {
  elementoId: string;
  elementoNombre: string;
  tipoElemento: "objetivo" | "actividad";
  sumaPesos: number;
  hijos: number;
}

export interface ResultadoCascada {
  objetivos: Objetivo[];
  actividades: Actividad[];
  advertenciasPeso: AdvertenciaPeso[];
}

/**
 * Recalcula recursivamente el avance de toda la cascada, de abajo (subactividades)
 * hacia arriba (objetivo estratégico), usando promedio ponderado por peso.
 *
 * avanceCalculado(padre) = suma( avanceCalculado(hijo) * peso(hijo) ) / 100
 *
 * El avance de un elemento SIN hijos se toma directamente de su avanceValidado.
 * No se calcula manualmente ningún avance de nivel superior: todo se deriva de aquí.
 */
export function recalcularCascada(objetivosIn: Objetivo[], actividadesIn: Actividad[]): ResultadoCascada {
  const objetivos = objetivosIn.map((o) => ({ ...o }));
  const actividades = actividadesIn.map((a) => ({ ...a }));

  const objetivoPorId = new Map(objetivos.map((o) => [o.id, o]));
  const actividadPorId = new Map(actividades.map((a) => [a.id, a]));

  const advertenciasPeso: AdvertenciaPeso[] = [];
  const objetivoCalculado = new Set<string>();
  const actividadCalculado = new Set<string>();

  function hijosDeObjetivo(o: Objetivo): { tipo: "objetivo" | "actividad"; peso: number; avance: number }[] {
    if (o.nivel === 3) {
      // Los hijos de una iniciativa son las actividades de primer nivel (nivel 4) que le pertenecen.
      const hijos = actividades.filter((a) => a.objetivoId === o.id && a.parentId === null);
      registrarAdvertencia(o.id, o.nombre, "objetivo", hijos.map((h) => h.peso));
      return hijos.map((h) => ({ tipo: "actividad" as const, peso: h.peso, avance: calcularActividad(h) }));
    }
    const hijos = objetivos.filter((x) => x.parentId === o.id);
    registrarAdvertencia(o.id, o.nombre, "objetivo", hijos.map((h) => h.peso));
    return hijos.map((h) => ({ tipo: "objetivo" as const, peso: h.peso, avance: calcularObjetivo(h) }));
  }

  function registrarAdvertencia(id: string, nombre: string, tipoElemento: "objetivo" | "actividad", pesos: number[]) {
    if (pesos.length === 0) return;
    const suma = pesos.reduce((a, b) => a + b, 0);
    if (Math.abs(suma - 100) > 0.01) {
      advertenciasPeso.push({ elementoId: id, elementoNombre: nombre, tipoElemento, sumaPesos: suma, hijos: pesos.length });
    }
  }

  function calcularObjetivo(o: Objetivo): number {
    if (objetivoCalculado.has(o.id)) return objetivoPorId.get(o.id)!.avanceCalculado;
    objetivoCalculado.add(o.id);

    const hijos = hijosDeObjetivo(o);
    let avance: number;
    if (hijos.length === 0) {
      avance = o.avanceValidado;
    } else {
      avance = hijos.reduce((sum, h) => sum + (h.avance * h.peso) / 100, 0);
    }
    avance = Math.max(0, Math.min(100, Math.round(avance * 10) / 10));
    const ref = objetivoPorId.get(o.id)!;
    ref.avanceCalculado = avance;
    return avance;
  }

  function calcularActividad(a: Actividad): number {
    if (actividadCalculado.has(a.id)) return actividadPorId.get(a.id)!.avanceCalculado;
    actividadCalculado.add(a.id);

    const hijos = actividades.filter((x) => x.parentId === a.id);
    registrarAdvertencia(a.id, a.nombre, "actividad", hijos.map((h) => h.peso));

    let avance: number;
    if (hijos.length === 0) {
      avance = a.avanceValidado;
    } else {
      avance = hijos.reduce((sum, h) => sum + (calcularActividad(h) * h.peso) / 100, 0);
    }
    avance = Math.max(0, Math.min(100, Math.round(avance * 10) / 10));
    const ref = actividadPorId.get(a.id)!;
    ref.avanceCalculado = avance;
    return avance;
  }

  // Disparar el cálculo para todos los objetivos raíz (nivel 1) primero, luego el resto por si acaso.
  objetivos.filter((o) => o.nivel === 1).forEach(calcularObjetivo);
  objetivos.forEach(calcularObjetivo);
  actividades.forEach(calcularActividad);

  return { objetivos, actividades, advertenciasPeso };
}

// Suma de pesos de un conjunto de hermanos - usado también en validación de formularios.
export function sumaPesos(pesos: number[]): number {
  return pesos.reduce((a, b) => a + b, 0);
}
