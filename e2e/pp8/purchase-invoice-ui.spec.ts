import { expect, test } from '@playwright/test';

const username = process.env.PP8_E2E_USERNAME;
const password = process.env.PP8_E2E_PASSWORD;
const enterpriseId = process.env.PP8_E2E_ENTERPRISE_ID ?? 'enterprise-e2e';

test('factura de compra UI no expone cuenta CxP ni thId manual', async ({ page }) => {
  if (!username || !password) {
    test.skip(true, 'PP8_E2E_USERNAME y PP8_E2E_PASSWORD son obligatorios');
  }

  await page.goto('/login');
  await page.locator('#username').fill(username!);
  await page.locator('#password').fill(password!);
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await page.waitForURL(/#\/enterprise\/list/, { timeout: 20_000 });
  await page.evaluate((enterprise) => localStorage.setItem('entData', JSON.stringify({
    id: enterprise, name: 'PP8 E2E', nit: 'E2E', logo: '', inventoryConfigType: 'WEIGHTED_AVERAGE',
  })), enterpriseId);

  await page.goto('/#/commercial/purchase-invoice');
  await expect(page.getByRole('heading', { name: /Creaci[oó]n de Factura de Compra/i })).toBeVisible();
  await expect(page.locator('#supplierSearch')).toBeVisible();
  await expect(page.getByText(/Plazo de pago/i)).toBeVisible();
  await expect(page.getByLabel(/ID Tercero/i)).toHaveCount(0);
  await expect(page.getByLabel(/Cuenta Contable/i)).toHaveCount(0);
});
