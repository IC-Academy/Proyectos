import { test, expect } from "@playwright/test";
import { irAInicioLimpio, login, logout } from "./helpers";

/**
 * Recorrido completo del criterio de aceptación (sección 23 del requerimiento):
 * Daniela asigna, Dante subdivide y solicita apoyo, Daniela y Jorge aprueban,
 * Jorge actualiza avance, y Dirección ve la propagación en dashboard/cascada/Gantt.
 *
 * Cada paso relevante adjunta una captura de pantalla al reporte HTML de
 * Playwright (`playwright-report/index.html`) como evidencia del recorrido.
 */
test.describe("Flujo completo de la cascada (criterio de aceptación)", () => {
  test("Ventas → Dante → solicitud interárea → Jorge (BI) → propagación a Dirección", async ({ page }, testInfo) => {
    async function evidencia(nombre: string) {
      const buffer = await page.screenshot({ fullPage: true });
      await testInfo.attach(nombre, { body: buffer, contentType: "image/png" });
    }

    await irAInicioLimpio(page);

    await test.step("Daniela (líder de Ventas) ve a Dante en su equipo y abre la actividad de visitas comerciales", async () => {
      await login(page, "daniela@demo.com");
      await page.click('.nav-item:has-text("Mi equipo")');
      await expect(page.locator("text=Dante Osorio")).toBeVisible();

      await page.click('.nav-item:has-text("Actividades")');
      await expect(page.locator("text=Concretar un mínimo de 10 visitas")).toBeVisible();
      await page.click("text=Concretar un mínimo de 10 visitas comerciales por semana");
      await expect(page.locator(".modal-box")).toBeVisible();
      await page.click('button:has-text("Subactividades")');
      await expect(page.locator("text=Subactividades (4)")).toBeVisible();
      await evidencia("01-daniela-ve-actividad-de-dante.png");
      await page.click(".modal-close");
      await logout(page);
    });

    await test.step("Dante divide su actividad en subactividades y solicita apoyo de Jorge (BI)", async () => {
      await login(page, "dante@demo.com");
      await page.click('.nav-item:has-text("Mi plan")');
      await page.click("text=Concretar un mínimo de 10 visitas comerciales por semana");
      await expect(page.locator(".modal-box")).toBeVisible();
      await page.click('button:has-text("Subactividades")');
      await expect(page.locator('.data-table tbody tr:has-text("Solicitar a Jorge Mejía")')).toBeVisible();
      await evidencia("02-dante-ve-subactividades-existentes.png");

      await page.click('button:has-text("+ Nueva subactividad")');
      // Se abre un segundo modal (formulario) apilado sobre el modal de
      // detalle de la actividad, que también usa la clase "modal-box wide".
      // Se toma el último para referirse siempre al formulario recién abierto.
      const subForm = page.locator(".modal-box.wide").last();
      await expect(subForm).toBeVisible();
      await subForm.locator('.field:has(label:text("Descripción / nombre")) input').fill("Dar seguimiento a interesados");
      const fechas = subForm.locator('input[type="date"]');
      await fechas.nth(0).fill("2026-08-01");
      await fechas.nth(1).fill("2026-09-15");
      await subForm.locator('input[type="checkbox"]').check();
      await subForm.locator('.field:has(label:text("Área requerida")) select').selectOption({ label: "Inteligencia de Negocios" });
      await subForm.locator('.field:has(label:text("Persona sugerida")) select').selectOption({ index: 1 });
      await subForm.locator("textarea").last().fill("Se requiere apoyo para dar seguimiento automatizado a interesados calificados.");
      await evidencia("03-dante-solicitud-apoyo-formulario.png");
      await subForm.locator('button:has-text("Enviar solicitud de apoyo")').click();
      await expect(page.locator(".modal-box.wide")).toHaveCount(1, { timeout: 5000 });
      // Cierra el modal de detalle de la actividad (el único que queda abierto)
      // antes de navegar, para no quedar bloqueados por el overlay.
      await page.click(".modal-close");
      await expect(page.locator(".modal-overlay")).toHaveCount(0);

      await page.click('.nav-item:has-text("Solicitudes")');
      await expect(page.locator("text=Dar seguimiento a interesados").first()).toBeVisible();
      await evidencia("04-dante-solicitud-pendiente.png");
      await logout(page);
    });

    await test.step("Daniela aprueba como líder solicitante", async () => {
      await login(page, "daniela@demo.com");
      await page.click('.nav-item:has-text("Aprobaciones")');
      const tarjeta = page.locator('.card:has-text("Dar seguimiento a interesados")');
      await expect(tarjeta).toBeVisible();
      await evidencia("05-daniela-bandeja-aprobaciones.png");
      await tarjeta.locator('button:has-text("Aceptar")').first().click();
      await expect(page.locator('.card:has-text("Dar seguimiento a interesados") button:has-text("Aceptar")')).toHaveCount(0);
      await logout(page);
    });

    await test.step("Jorge aprueba como líder del área requerida (BI) y la actividad se crea", async () => {
      await login(page, "jorge@demo.com");
      await page.click('.nav-item:has-text("Aprobaciones")');
      // El panel de Administrador también lista todas las solicitudes del
      // sistema en una tabla aparte; se acota a la tarjeta de la bandeja de
      // aprobaciones pendientes (la única con un botón "Aceptar").
      const tarjeta = page.locator('.card:has-text("Dar seguimiento a interesados"):has(button:has-text("Aceptar"))');
      await expect(tarjeta).toBeVisible();
      await tarjeta.locator('button:has-text("Aceptar")').first().click();
      await page.waitForTimeout(300);
      await evidencia("06-jorge-aprobo-solicitud.png");
      await logout(page);
    });

    await test.step("Jorge actualiza el avance de su actividad de automatización", async () => {
      await login(page, "jorge@demo.com");
      await page.click('.nav-item:has-text("Resumen")');
      await expect(page.locator("text=Mis actividades asignadas")).toBeVisible();
      await expect(page.locator("text=Desarrollar automatización para prospección comercial")).toBeVisible();
      await page.click("text=Desarrollar automatización para prospección comercial");
      await expect(page.locator(".modal-box")).toBeVisible();
      await page.fill('input[type="range"]', "70");
      await evidencia("07-jorge-actualiza-avance.png");
      await page.click('button:has-text("Guardar")');
      await page.waitForTimeout(300);
      await page.click(".modal-close");
      await logout(page);
    });

    await test.step("Dirección ve la propagación del avance en el dashboard, la cascada y el Gantt", async () => {
      await login(page, "gabriel@demo.com");
      await page.click('.nav-item:has-text("Resumen ejecutivo")');
      await expect(page.locator(".kpi-grid").first()).toBeVisible();
      await evidencia("08-direccion-dashboard-propagacion.png");

      await page.click('.nav-item:has-text("Cascada")');
      await expect(page.locator(".cascade-wrap")).toBeVisible();
      await expect(page.locator("text=Cuello de botella detectado")).toBeVisible();
      await evidencia("09-direccion-cascada-cuello-de-botella.png");

      await page.click('.nav-item:has-text("Gantt")');
      await expect(page.locator(".gantt-wrap")).toBeVisible();
      await evidencia("10-direccion-gantt.png");

      await page.click('.nav-item:has-text("Alertas")');
      await expect(page.locator(".card").first()).toBeVisible();
      await evidencia("11-direccion-alertas.png");
    });
  });
});
