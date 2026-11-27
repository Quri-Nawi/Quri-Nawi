import { test, expect } from '@playwright/test';

test('catálogo, filtros, comparación, aporte y respaldo offline', async ({ page, context }, testInfo) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/?rio=Kaka');
  await expect(page.locator('.basin-hero')).toHaveAttribute('data-status', 'ready');
  await expect(page.getByRole('region', { name: 'Río Kaka', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Ver en la lista' }).click();
  await expect(page.locator('.record')).toHaveCount(2);
  await page.locator('.record summary').first().click();
  await expect(page.locator('.record details').first().getByRole('link').last()).toHaveAttribute('href', /^https:/);
  await expect(page.locator('.compare-note')).toContainText('Ambas observaciones son de 1998');
  await page.getByRole('button', { name: 'Limpiar selección' }).click();
  await page.locator('.select-record').first().click();
  await expect(page.locator('.compare-slot').first()).toContainText('0,088');
  await page.locator('#aportar input[name=title]').fill('Prueba local de la demo');
  await page.locator('#aportar input[name=source]').fill('https://example.org/demo');
  await page.locator('#aportar select[name=territory]').selectOption('Kaka');
  await page.getByRole('button', { name: /Guardar borrador/ }).click();
  await expect(page.locator('.drafts')).toContainText('Prueba local de la demo');
  await page.getByRole('button', { name: /Instalar app/ }).click();
  await expect(page.getByRole('dialog')).toContainText('preparado para consulta sin conexión');
  await page.getByRole('button', { name: 'Cerrar instalación' }).click();
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) await new Promise(resolve => navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true }));
  });
  const metrics = await page.evaluate(() => ({ userAgent: navigator.userAgent, navigation: performance.getEntriesByType('navigation')[0].toJSON(), resources: performance.getEntriesByType('resource').map(({ name, transferSize, decodedBodySize, duration }) => ({ name: new URL(name).pathname, transferSize, decodedBodySize, duration })) }));
  await testInfo.attach('recursos.json', { body: JSON.stringify(metrics, null, 2), contentType: 'application/json' });
  await page.goto('/?rio=Kaka');
  await expect(page.locator('.basin-hero')).toHaveAttribute('data-status', 'ready');
  await page.screenshot({ path: testInfo.outputPath('online.png'), fullPage: true });
  await context.setOffline(true);
  await page.goto('/?rio=Kaka');
  await expect(page.locator('.basin-hero')).toHaveAttribute('data-status', 'ready');
  await expect(page.getByRole('region', { name: 'Río Kaka', exact: true })).toBeVisible();
  const data = await page.evaluate(async () => {
    const catalog = await fetch('/api/catalogo').then(r => r.json());
    const sources = await fetch('/api/fuentes').then(r => r.json());
    return { records: catalog.records.length, sources: sources.sources.length };
  });
  expect(data).toEqual({ records: 11, sources: 52 });
  await expect(page.locator('.drafts')).toContainText('Prueba local de la demo');
  await page.screenshot({ path: testInfo.outputPath('offline.png'), fullPage: true });
  expect(errors).toEqual([]);
});

test('movimiento reducido y pérdida de WebGL conservan acceso al atlas', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('.basin-hero')).toHaveAttribute('data-status', 'ready');
  await expect(page.getByRole('button', { name: 'Reanudar el giro' })).toBeVisible();
  await page.locator('.basin-canvas canvas').evaluate(canvas => {
    const gl = canvas.getContext('webgl2');
    const extension = gl?.getExtension('WEBGL_lose_context');
    if (!extension) throw new Error('No está disponible WEBGL_lose_context');
    extension.loseContext();
  });
  await expect(page.locator('.basin-hero')).toHaveAttribute('data-status', 'error');
  await page.getByRole('link', { name: 'Usa la vista 2D y la lista' }).click();
  await expect(page.locator('.record')).toHaveCount(11);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
