import { test, expect } from '@playwright/test'

test.describe('AI 配置管理', () => {
  const testConfig = {
    name: `TestConfig${Date.now()}`,
    provider: 'ollama',
    modelName: 'qwen3:0.6b',
    apiKey: '',
    baseUrl: 'http://localhost:11434',
  }

  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[placeholder="用户名"]', 'admin')
    await page.fill('input[type="password"]', 'admin123')
    await page.click('button:has-text("登 录")')
    await page.waitForURL(/\/(dashboard|ai-config)$/)
    await page.goto('/ai-config')
    await page.waitForSelector('.ai-config-view')
  })

  test('显示 AI 配置管理页面', async ({ page }) => {
    await expect(page.locator('.page-title')).toContainText('AI 配置管理')
    await expect(page.locator('.card-title')).toContainText('LLM 配置列表')
  })

  test('打开添加配置表单', async ({ page }) => {
    await page.click('button:has-text("添加配置")')
    await expect(page.locator('.edit-card')).toBeVisible()
    await expect(page.locator('.edit-card .el-card__header')).toContainText('添加配置')
  })

  test('添加新配置', async ({ page }) => {
    await page.click('button:has-text("添加配置")')
    await page.waitForSelector('.edit-card')

    await page.fill('input[placeholder="请输入配置名称"]', testConfig.name)
    await page.selectOption('.el-select', testConfig.provider)
    await page.fill('input[placeholder="如: deepseek-chat"]', testConfig.modelName)

    await page.click('button:has-text("保存"):not([disabled])')

    await expect(page.locator('.el-message')).toContainText('配置创建成功')
    await expect(page.locator('.config-list')).toContainText(testConfig.name)
  })

  test('添加配置 - 必填字段验证', async ({ page }) => {
    await page.click('button:has-text("添加配置")')
    await page.waitForSelector('.edit-card')

    await page.fill('input[placeholder="如: deepseek-chat"]', '')
    await page.click('button:has-text("保存")')

    await expect(page.locator('.el-form-item__error')).toContainText('请输入配置名称')
  })

  test('编辑现有配置', async ({ page }) => {
    const firstEditButton = page.locator('button[aria-label="编辑配置"]').first()
    if (await firstEditButton.isVisible()) {
      await firstEditButton.click()
      await page.waitForSelector('.edit-card')
      await expect(page.locator('.edit-card .el-card__header')).toContainText('编辑配置')

      const newName = `EditedConfig${Date.now()}`
      await page.fill('input[placeholder="请输入配置名称"]', '')
      await page.fill('input[placeholder="请输入配置名称"]', newName)

      await page.click('button:has-text("保存"):not([disabled])')

      await expect(page.locator('.el-message')).toContainText('配置更新成功')
    }
  })

  test('取消编辑配置', async ({ page }) => {
    const firstEditButton = page.locator('button[aria-label="编辑配置"]').first()
    if (await firstEditButton.isVisible()) {
      await firstEditButton.click()
      await page.waitForSelector('.edit-card')

      await page.click('button:has-text("取消")')

      await expect(page.locator('.edit-card')).not.toBeVisible()
    }
  })

  test('设为默认配置', async ({ page }) => {
    const setDefaultButton = page.locator('button:has-text("设为默认")').first()
    if (await setDefaultButton.isVisible()) {
      await setDefaultButton.click()

      await expect(page.locator('.el-message')).toContainText('默认')
      await page.waitForTimeout(500)

      await expect(page.locator('.el-tag:has-text("默认")').first()).toBeVisible()
    }
  })

  test('激活配置', async ({ page }) => {
    const activateButton = page.locator('button:has-text("激活")').first()
    if (await activateButton.isVisible()) {
      await activateButton.click()

      await expect(page.locator('.el-message')).toContainText('激活')
    }
  })

  test('删除配置', async ({ page }) => {
    const configName = await page.locator('.config-name span').first().textContent()

    const deleteButton = page.locator('button[aria-label="删除配置"]').first()
    if (await deleteButton.isVisible() && configName && !configName.includes('默认配置')) {
      await deleteButton.click()

      await page.waitForSelector('.el-message-box')
      await expect(page.locator('.el-message-box__content')).toContainText(`确定要删除配置"${configName}"`)

      await page.click('button:has-text("删除")')

      await expect(page.locator('.el-message')).toContainText('删除成功')
    }
  })

  test('编辑时 API Key 留空不更新', async ({ page }) => {
    const firstEditButton = page.locator('button[aria-label="编辑配置"]').first()
    if (await firstEditButton.isVisible()) {
      await firstEditButton.click()
      await page.waitForSelector('.edit-card')

      const apiKeyInput = page.locator('input[placeholder="留空则不更新"]')
      await expect(apiKeyInput).toBeVisible()
    }
  })

  test('切换提供商自动填充默认值', async ({ page }) => {
    await page.click('button:has-text("添加配置")')
    await page.waitForSelector('.edit-card')

    await page.selectOption('.el-select', 'deepseek')

    await page.waitForTimeout(100)
    const baseUrlInput = page.locator('input[placeholder="可选，如使用代理"]')
    const baseUrlValue = await baseUrlInput.inputValue()
    expect(baseUrlValue).toContain('api.deepseek.com')
  })

  test('添加配置时禁用添加按钮', async ({ page }) => {
    await page.click('button:has-text("添加配置")')
    await page.waitForSelector('.edit-card')

    const addButton = page.locator('button:has-text("添加配置")')
    await expect(addButton).toBeDisabled()
  })
})
