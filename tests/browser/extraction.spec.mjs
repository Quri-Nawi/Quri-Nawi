import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const fields = ['Título', 'Autoría', 'Matriz', 'Especie', 'Lugar', 'Método', 'Fechas de muestreo', 'Fecha de publicación'];
const open = async page => { await page.goto('/#aportar'); await page.getByText('Importar informe y revisar sugerencias', { exact: true }).click(); };
const field = async (page, name) => page.locator('.extraction-fields').getByRole('button', { name: new RegExp('^' + name + ' ·') }).click();
async function identify(page, url) {
  await page.getByLabel('Fuente pública HTTPS').fill(url);
  await page.getByLabel('Persona que revisa', { exact: true }).fill('Revisión técnica de prueba');
  await page.getByLabel('Territorio del aporte').selectOption('Beni');
  await page.locator('input[name=publicMetadata]').check();
}

test('texto → respaldo → corrección humana → propuesta pendiente exportable', async ({ page }) => {
  await open(page);
  await page.getByLabel('Informe autorizado').setInputFiles({ name: 'informe.txt', mimeType: 'text/plain', buffer: Buffer.from('Título: Informe sintético para la demo\nAutores: Persona Uno\nPersona Dos\nMuestras de cabello en un ejercicio de prueba sin datos científicos reales.') });
  await expect(page.locator('.extraction-feedback')).toContainText('Lectura terminada');
  await identify(page, 'https://example.org/informe-sintetico');
  await page.getByRole('button', { name: 'Guardar propuesta pendiente' }).click();
  await expect(page.locator('.extraction-feedback')).toContainText('Revisa todos los campos');
  for (const name of fields) {
    await field(page, name);
    await page.getByRole('combobox', { name: 'Decisión', exact: true }).selectOption('accept');
  }
  await field(page, 'Autoría');
  await page.getByRole('combobox', { name: 'Decisión', exact: true }).selectOption('correct');
  await page.getByLabel('Valor corregido').fill('Persona Uno y Persona Dos');
  await page.getByLabel('Fragmento literal de respaldo').fill('Persona Uno\nPersona Dos');
  await page.getByLabel('Motivo de la decisión').fill('La lista de autoría ocupa dos líneas.');
  await page.getByRole('button', { name: 'Guardar propuesta pendiente' }).click();
  await expect(page.locator('.extraction-feedback')).toContainText('Propuesta pendiente guardada');
  await expect(page.locator('.drafts')).toContainText('Informe sintético para la demo');
  const downloaded = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Descargar expediente' }).click();
  const proposal = JSON.parse(await readFile(await (await downloaded).path(), 'utf8'));
  expect(proposal.state).toBe('pendiente_revision');
  expect(proposal.queue).toBeNull();
  expect(proposal.review).toBeNull();
  expect(proposal.extraction.fields.find(f => f.suggestion.field === 'authors').value).toBe('Persona Uno y Persona Dos');
  expect(proposal.extraction.fields.find(f => f.suggestion.field === 'species').value).toBeNull();
  await page.reload();
  await expect(page.locator('.drafts')).toContainText('Informe sintético para la demo');
});

test('informe CEDIB real: metadatos cotejados y revisión pendiente', async ({ page }, testInfo) => {
  test.skip(!process.env.QURI_REPORT_PDF, 'Requiere copia autorizada local, no redistribuida en Git.');
  await open(page);
  await page.getByLabel('Informe autorizado').setInputFiles(process.env.QURI_REPORT_PDF);
  await expect(page.locator('.extraction-feedback')).toContainText('Lectura terminada', { timeout: 50_000 });
  await expect(page.locator('.document-hash')).toHaveText('5aa2ff430cd30e34f693d6ab7a61448f7352dc417199e219c1d9fb8a4e88c137');
  const measured = [];
  for (const name of fields) {
    await field(page, name);
    measured.push({ field: name, value: await page.locator('.extraction-decision>p strong').innerText(), page: Number(await page.getByLabel('Página del documento', { exact: true }).inputValue()) });
    await page.getByRole('combobox', { name: 'Decisión', exact: true }).selectOption('accept');
  }
  expect(measured.find(f => f.field === 'Título')).toMatchObject({ value: 'MERCURIO Y SALUD EN LA AMAZONIA BOLIVIANA', page: 2 });
  expect(measured.find(f => f.field === 'Autoría').value).toBe('Roger Carvajal Saravia');
  expect(measured.find(f => f.field === 'Especie').value).toBe('Desconocido');
  expect(measured.find(f => f.field === 'Lugar')).toMatchObject({ value: 'Beni y Madre de Dios', page: 2 });
  expect(measured.find(f => f.field === 'Método')).toMatchObject({ value: 'Analizador Directo de Mercurio Lumex RA-915M', page: 35 });
  expect(measured.find(f => f.field === 'Fechas de muestreo')).toMatchObject({ value: '2023–2024', page: 32 });
  expect(measured.find(f => f.field === 'Fecha de publicación')).toMatchObject({ value: 'Junio de 2026', page: 6 });
  await identify(page, 'https://www.cedib.org/wp-content/uploads/2026/08/MERCURIO-Y-SALUD-EN-LA-AMAZONIA-BOLIVIANA-.pdf');
  await field(page, 'Autoría');
  await page.getByRole('combobox', { name: 'Decisión', exact: true }).selectOption('correct');
  await page.getByLabel('Valor corregido').fill('Roger Carvajal Saravia; Oscar Campanini; Pablo Villegas; Mery Limachi Alcon; Noemi Tirado; Heidy Garcia; Erick Forton');
  await page.getByLabel('Fragmento literal de respaldo').fill('Roger Carvajal Saravia');
  await page.getByLabel('Motivo de la decisión').fill('Se cotejó la lista de autores en página PDF 5; la sugerencia solo conservaba el primer nombre.');
  await page.getByRole('button', { name: 'Guardar propuesta pendiente' }).click();
  await expect(page.locator('.extraction-feedback')).toContainText('Propuesta pendiente guardada');
  await expect(page.locator('.drafts')).toContainText('MERCURIO Y SALUD EN LA AMAZONIA BOLIVIANA');
  await testInfo.attach('evaluacion-informe.json', { body: JSON.stringify({ sha256: '5aa2ff430cd30e34f693d6ab7a61448f7352dc417199e219c1d9fb8a4e88c137', measured, correct: 5, partial: ['Autoría', 'Matriz'], unknown: ['Especie'], humanCorrection: 'Autoría; el expediente sigue pendiente de revisión institucional' }, null, 2), contentType: 'application/json' });
});
