import { test, expect } from "@playwright/test";
import { irAInicioLimpio, login } from "./helpers";

test.describe("Constructor SMART con IA simulada (Dirección)", () => {
  test.beforeEach(async ({ page }) => {
    await irAInicioLimpio(page);
    await login(page, "gabriel@demo.com");
    await page.click('.nav-item:has-text("Objetivos estratégicos")');
  });

  test("bloquea la creación cuando las ponderaciones de área no suman 100%", async ({ page }) => {
    await page.click('button:has-text("Nuevo objetivo")');
    await page.fill('.field:has(label:text("Nombre corto")) input', "Objetivo incompleto de prueba");
    await page.fill('.field:has(label:text("Descripción inicial")) textarea', "Descripción de prueba suficientemente larga para pasar validación.");
    await page.click('button:has-text("Siguiente")');

    await page.fill('.field:has(label:text("Indicador")) input', "Indicador X");
    await page.fill('.field:has(label:text("Línea base")) input', "10");
    await page.fill('.field:has(label:text("Meta")) input', "20");
    await page.click('button:has-text("Siguiente")');

    const primeraArea = page.locator(".area-weight-row").first();
    await primeraArea.locator('input[type="checkbox"]').check();
    await primeraArea.locator('input[type="number"]').fill("40"); // suma 40%, no 100%
    await page.click('button:has-text("Siguiente")');

    await page.fill('.field:has(label:text("Relevancia estratégica")) textarea', "Relevancia de prueba con longitud suficiente para pasar la validación.");
    await page.click('button:has-text("Siguiente")');
    await page.click('button:has-text("Siguiente")'); // temporal -> revisión

    await page.click('button:has-text("Mejorar con IA")');
    await expect(page.locator(".smart-score-ring")).toBeVisible();
    await expect(page.locator("text=Las ponderaciones de las áreas suman 40%")).toBeVisible();
    await expect(page.locator('button:has-text("Crear objetivo")')).toBeDisabled();
  });

  test("crea un objetivo SMART completo y aparece en el listado con su calificación IA", async ({ page }) => {
    await page.click('button:has-text("Nuevo objetivo")');
    await page.fill('.field:has(label:text("Nombre corto")) input', "Reducir tiempo de respuesta a clientes");
    await page.fill('.field:has(label:text("Descripción inicial")) textarea', "Reducir el tiempo de respuesta a clientes de 48 a 12 horas durante el año fiscal.");
    await page.fill('.field:has(label:text("Resultado esperado")) textarea', "Clientes atendidos en menos de 12 horas.");
    await page.click('button:has-text("Siguiente")');

    await page.fill('.field:has(label:text("Indicador")) input', "Horas de respuesta");
    await page.fill('.field:has(label:text("Línea base")) input', "48");
    await page.fill('.field:has(label:text("Meta")) input', "12");
    await page.fill('.field:has(label:text("Unidad")) input', "horas");
    await page.click('button:has-text("Siguiente")');

    const pesos: Record<string, string> = { Ventas: "50", Marketing: "30", Operaciones: "20" };
    const filas = page.locator(".area-weight-row");
    const n = await filas.count();
    for (let i = 0; i < n; i++) {
      const fila = filas.nth(i);
      const nombre = (await fila.locator(".name").innerText()).trim();
      if (pesos[nombre]) {
        await fila.locator('input[type="checkbox"]').check();
        await fila.locator('input[type="number"]').fill(pesos[nombre]);
      }
    }
    await page.fill('.field:has(label:text("Evidencia esperada")) textarea', "Reportes de mesa de ayuda.");
    await page.fill('.field:has(label:text("Riesgos iniciales")) textarea', "Rotación de personal de soporte.");
    await page.click('button:has-text("Siguiente")');

    await page.fill('.field:has(label:text("Relevancia estratégica")) textarea', "Mejora la retención de clientes clave para el crecimiento sostenido.");
    await page.click('button:has-text("Siguiente")');
    await page.click('button:has-text("Siguiente")'); // temporal -> revisión

    await page.click('button:has-text("Mejorar con IA")');
    await expect(page.locator(".smart-score-ring")).toBeVisible();

    const crearBtn = page.locator('button:has-text("Crear objetivo")');
    await expect(crearBtn).toBeEnabled();
    await crearBtn.click();

    await expect(page.locator(".modal-overlay")).toHaveCount(0);
    await expect(page.locator("text=Reducir tiempo de respuesta a clientes")).toBeVisible();
  });
});
