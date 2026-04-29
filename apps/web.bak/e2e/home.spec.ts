import { test, expect } from '@playwright/test'

test.describe('首页功能', () => {
  test('首页正确渲染且可导航', async ({ page }) => {
    await page.goto('/')

    await expect(page.locator('.logo-text')).toHaveText('req2task')
    await expect(page.locator('.hero-title')).toContainText('智能需求管理')
    await expect(page.locator('.hero-desc')).toContainText('AI 驱动')
    await expect(page.locator('.section-title')).toHaveText('核心功能')

    const featureCards = page.locator('.feature-card')
    await expect(featureCards).toHaveCount(6)

    await expect(page.locator('.stat-value').first()).toHaveText('99.9%')
  })

  test('点击登录按钮跳转登录页', async ({ page }) => {
    await page.goto('/')

    await page.click('button:has-text("登录")')
    await expect(page.url()).toContain('/login')
  })

  test('点击立即开始按钮跳转注册页', async ({ page }) => {
    await page.goto('/')

    await page.click('button:has-text("立即开始")')
    await expect(page.url()).toContain('/register')
  })

  test('点击了解更多跳转登录页', async ({ page }) => {
    await page.goto('/')

    await page.click('button:has-text("了解更多")')
    await expect(page.url()).toContain('/login')
  })

  test('点击免费开始按钮跳转注册页', async ({ page }) => {
    await page.goto('/')

    await page.click('button:has-text("免费开始")')
    await expect(page.url()).toContain('/register')
  })

  test('首页响应式布局', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')

    await expect(page.locator('.hero-title')).toBeVisible()
    await expect(page.locator('.features-grid')).toBeVisible()

    await expect(page.locator('.features-grid')).toHaveCSS('grid-template-columns', '1fr')
  })

  test('页脚正确显示', async ({ page }) => {
    await page.goto('/')

    await expect(page.locator('.footer p')).toContainText('2024')
    await expect(page.locator('.footer p')).toContainText('req2task')
  })

  test('功能卡片悬停效果', async ({ page }) => {
    await page.goto('/')

    const firstCard = page.locator('.feature-card').first()
    await firstCard.hover()
  })
})
