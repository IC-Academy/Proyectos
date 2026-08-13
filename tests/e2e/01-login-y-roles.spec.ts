import { test, expect } from "@playwright/test";
import { irAInicioLimpio, login, logout } from "./helpers";

test.describe("Login y navegación por rol", () => {
  test.beforeEach(async ({ page }) => {
    await irAInicioLimpio(page);
  });

  test("login falla con credenciales incorrectas", async ({ page }) => {
    await page.fill('input[type="email"]', "gabriel@demo.com");
    await page.fill('input[type="password"]', "clave-incorrecta");
    await page.click('button[type="submit"]');
    await expect(page.locator(".login-error")).toBeVisible();
    await expect(page.locator(".app-shell")).toHaveCount(0);
  });

  const casos: Array<{ correo: string; menuEsperado: string; menuAusente: string }> = [
    { correo: "gabriel@demo.com", menuEsperado: "Objetivos estratégicos", menuAusente: "Usuarios" },
    { correo: "daniela@demo.com", menuEsperado: "Proyectos del área", menuAusente: "Objetivos estratégicos" },
    { correo: "dante@demo.com", menuEsperado: "Mi plan", menuAusente: "Proyectos del área" },
    { correo: "jorge@demo.com", menuEsperado: "Integración EDD", menuAusente: "Mi plan" },
  ];

  for (const c of casos) {
    test(`${c.correo} ve su navegación propia (sin selector manual de rol)`, async ({ page }) => {
      await login(page, c.correo);
      await expect(page.locator(`.nav-item:has-text("${c.menuEsperado}")`)).toBeVisible();
      await expect(page.locator(`.nav-item:has-text("${c.menuAusente}")`)).toHaveCount(0);
      // No debe existir ningún control para cambiar el rol manualmente.
      await expect(page.locator("select#rol, [data-testid=rol-selector]")).toHaveCount(0);
      await logout(page);
      await expect(page.locator(".login-screen")).toBeVisible();
    });
  }

  test("la sesión persiste tras recargar la página", async ({ page }) => {
    await login(page, "daniela@demo.com");
    await page.reload({ waitUntil: "networkidle" });
    await expect(page.locator(".app-shell")).toBeVisible();
    await expect(page.locator("text=Daniela Juárez")).toBeVisible();
  });
});
