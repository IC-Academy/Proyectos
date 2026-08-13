import { defineConfig, devices } from "@playwright/test";

// Configuración de pruebas end-to-end (Playwright) para el Portal de
// Objetivos en Cascada. Corre contra una copia de producción (`dist/`)
// servida localmente con `vite preview`, bajo la misma base `/Proyectos/`
// que usa GitHub Pages, para probar exactamente lo que se publica.
export default defineConfig({
  testDir: "./tests/e2e",
  outputDir: "./test-results",
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
  ],
  use: {
    baseURL: "http://127.0.0.1:4173/Proyectos/",
    trace: "retain-on-failure",
    screenshot: "on",
    video: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run preview -- --port 4173 --strictPort",
    url: "http://127.0.0.1:4173/Proyectos/",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
