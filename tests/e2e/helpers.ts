import { expect, type Page } from "@playwright/test";

/** Usuarios de prueba precargados en la demo (ver src/data/seed.ts). */
export const USUARIOS = {
  direccion: { correo: "gabriel@demo.com", password: "1234" },
  liderVentas: { correo: "daniela@demo.com", password: "1234" },
  colaboradorVentas: { correo: "dante@demo.com", password: "1234" },
  admin: { correo: "jorge@demo.com", password: "1234" },
} as const;

/** Va a la raíz de la app y limpia localStorage para arrancar de datos demo frescos. */
export async function irAInicioLimpio(page: Page) {
  await page.goto("./");
  await page.evaluate(() => window.localStorage.clear());
  await page.goto("./", { waitUntil: "networkidle" });
}

export async function login(page: Page, correo: string, password = "1234") {
  await page.goto("./");
  await page.fill('input[type="email"]', correo);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await expect(page.locator(".app-shell")).toBeVisible({ timeout: 8000 });
}

export async function logout(page: Page) {
  await page.click("text=Cerrar sesión");
  await expect(page.locator(".login-screen")).toBeVisible({ timeout: 5000 });
}
