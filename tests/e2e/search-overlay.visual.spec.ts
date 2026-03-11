import { expect, test } from '@playwright/test'

test.describe('Search overlay visual', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => window.localStorage.clear())
    await page.goto('/')
  })

  test('abre buscador, filtra por form y pago, valida agrupación por bloques', async ({ page }) => {
    await page.getByRole('button', { name: 'Buscar', exact: true }).click()

    const searchInput = page.getByPlaceholder('Buscar herramientas, acciones, formularios, SEO…')
    await expect(searchInput).toBeVisible()

    await searchInput.fill('form')
    const overlay = page.locator('div').filter({ has: searchInput }).first()
    await expect(overlay.getByText('Acciones del sitio')).toBeVisible()
    await expect(overlay.getByText('Panel de control')).toBeVisible()
    await expect(overlay.getByText('Formularios y envíos')).toBeVisible()
    await expect(overlay).toHaveScreenshot(['search-overlay.visual', 'filtro-form.png'])

    await searchInput.fill('pago')
    await expect(overlay.getByText('Panel de control')).toBeVisible()
    await expect(overlay.getByRole('button', { name: /Cobrar pagos en persona/i })).toBeVisible()
    await expect(overlay.getByText('Acciones del sitio')).toHaveCount(0)
    await expect(overlay).toHaveScreenshot(['search-overlay.visual', 'filtro-pago.png'])
  })
})
