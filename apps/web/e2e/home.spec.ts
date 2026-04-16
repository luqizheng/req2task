import { test, expect } from '@playwright/test'

test('homepage has correct title', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('h1')).toHaveText('req2task')
  await expect(page.locator('p')).toHaveText('Welcome to req2task')
})