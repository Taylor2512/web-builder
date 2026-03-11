import { expect, test } from '@playwright/test'

test.describe('Pages menu visual', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => window.localStorage.clear())
    await page.goto('/')
  })

  test('abre menú de páginas, valida secciones y estado activo', async ({ page }) => {
    await page.getByRole('button', { name: 'Páginas', exact: true }).first().click()

    const pageMenuTrigger = page.getByRole('button', { name: /^Home\s*▾$/ })
    await pageMenuTrigger.click()

    const pagesMenu = page.locator('div').filter({ hasText: 'Páginas del sitio' }).filter({ hasText: 'Ventanas emergentes' }).first()
    await expect(pagesMenu.getByText('Páginas del sitio')).toBeVisible()
    await expect(pagesMenu.getByText('Ventanas emergentes')).toBeVisible()

    const activePageItem = pagesMenu.getByRole('button', { name: 'Home', exact: true })
    await expect(activePageItem).toHaveCSS('background-color', 'rgb(17, 109, 255)')
    await expect(activePageItem).toHaveCSS('color', 'rgb(255, 255, 255)')

    await expect(pagesMenu).toHaveScreenshot(['pages-menu.visual', 'menu-secciones-y-activo.png'])
  })
})
