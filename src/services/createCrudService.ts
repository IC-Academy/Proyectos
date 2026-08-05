import { readCollection, writeCollection } from "./storage";

export interface CrudService<T extends { id: string }> {
  getAll(): T[];
  getById(id: string): T | undefined;
  create(item: T): T;
  update(id: string, patch: Partial<T>): T | undefined;
  delete(id: string): void;
  replaceAll(items: T[]): void;
  reset(): void;
}

/**
 * Fábrica de un servicio CRUD genérico respaldado por LocalStorage.
 * Expone la misma forma que tendría un servicio contra una API real / Dataverse
 * (getAll, getById, create, update, delete) para facilitar el reemplazo futuro.
 */
export function createCrudService<T extends { id: string }>(name: string, seed: T[]): CrudService<T> {
  return {
    getAll(): T[] {
      return readCollection<T>(name, seed);
    },
    getById(id: string): T | undefined {
      return this.getAll().find((x) => x.id === id);
    },
    create(item: T): T {
      const all = this.getAll();
      const next = [...all, item];
      writeCollection(name, next);
      return item;
    },
    update(id: string, patch: Partial<T>): T | undefined {
      const all = this.getAll();
      let updated: T | undefined;
      const next = all.map((x) => {
        if (x.id === id) {
          updated = { ...x, ...patch };
          return updated;
        }
        return x;
      });
      writeCollection(name, next);
      return updated;
    },
    delete(id: string): void {
      const all = this.getAll();
      writeCollection(
        name,
        all.filter((x) => x.id !== id)
      );
    },
    replaceAll(items: T[]): void {
      writeCollection(name, items);
    },
    reset(): void {
      writeCollection(name, seed);
    },
  };
}
