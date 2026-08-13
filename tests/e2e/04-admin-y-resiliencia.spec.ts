import { test, expect } from "@playwright/test";
import { irAInicioLimpio, login, logout } from "./helpers";

test.describe("Administración y resiliencia local", () => {
  test.beforeEach(async ({ page }) => {
    await irAInicioLimpio(page);
  });

  test("Jorge (Administrador) edita un usuario existente", async ({ page }) => {
    await login(page, "jorge@demo.com");
    await page.click('.nav-item:has-text("Usuarios")');
    const fila = page.locator('tr:has-text("Dante Osorio")');
    await expect(fila).toBeVisible();
    await fila.locator('button:has-text("Editar")').click();

    await expect(page.locator(".modal-box")).toBeVisible();
    const puestoInput = page.locator('.field.full:has(label:text("Puesto")) input');
    await puestoInput.fill("Ejecutivo de ventas senior");
    await page.click('button:has-text("Guardar")');

    await expect(page.locator(".modal-overlay")).toHaveCount(0);
    await expect(page.locator('tr:has-text("Dante Osorio")')).toContainText("Ejecutivo de ventas senior");
    await logout(page);
  });

  test("Jorge restablece los datos de demostración desde Configuración", async ({ page }) => {
    await login(page, "jorge@demo.com");
    await page.click('.nav-item:has-text("Configuración")');
    await expect(page.locator("text=Zona de riesgo")).toBeVisible();

    await page.click('button:has-text("Restablecer datos de demostración")');
    await expect(page.locator("text=¿Confirmas que deseas borrar")).toBeVisible();
    await page.click('button:has-text("Sí, restablecer")');

    await expect(page.locator("text=¿Confirmas que deseas borrar")).toHaveCount(0);
    // Los datos demo originales deben seguir presentes tras el restablecimiento.
    await page.click('.nav-item:has-text("Usuarios")');
    await expect(page.locator('tr:has-text("Dante Osorio")')).toBeVisible();
    await logout(page);
  });

  test("Dirección filtra el Gantt por área y ve solo esas actividades", async ({ page }) => {
    await login(page, "gabriel@demo.com");
    await page.click('.nav-item:has-text("Gantt")');
    await expect(page.locator(".gantt-wrap")).toBeVisible();

    const filasAntes = await page.locator(".gantt-row").count();
    expect(filasAntes).toBeGreaterThan(0);

    await page.selectOption('.filters-row select >> nth=1', { label: "Ventas" });
    await expect(page.locator(".gantt-wrap")).toBeVisible();
    const filasDespues = await page.locator(".gantt-row").count();
    expect(filasDespues).toBeGreaterThan(0);
    expect(filasDespues).toBeLessThanOrEqual(filasAntes);
    await logout(page);
  });

  test("Dante agrega un comentario a su actividad y lo ve reflejado", async ({ page }) => {
    await login(page, "dante@demo.com");
    await page.click('.nav-item:has-text("Mi plan")');
    await page.click("text=Concretar un mínimo de 10 visitas comerciales por semana");
    await expect(page.locator(".modal-box")).toBeVisible();

    await page.click('button:has-text("Comentarios")');
    const texto = `Comentario de prueba automatizada ${Date.now()}`;
    await page.fill(".modal-box textarea", texto);
    await page.click('button:has-text("Comentar")');

    await expect(page.locator(`text=${texto}`)).toBeVisible();
    await page.click(".modal-close");
    await logout(page);
  });

  test("localStorage corrupto se recupera automáticamente sin pantalla en blanco", async ({ page }) => {
    await page.goto("./");
    await page.evaluate(() => {
      // Deja basura no-JSON bajo una clave con el prefijo de la app para
      // forzar la ruta de recuperación de src/services/storage.ts.
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (k && k.startsWith("icportal:") && k.endsWith(":db")) {
          window.localStorage.setItem(k, "{esto-no-es-json-valido");
        }
      }
    });
    await page.reload({ waitUntil: "networkidle" });

    // La aplicación debe seguir siendo utilizable (no debe quedar en blanco).
    await expect(page.locator(".login-screen")).toBeVisible();
    await login(page, "gabriel@demo.com");
    await expect(page.locator(".app-shell")).toBeVisible();
  });
});
