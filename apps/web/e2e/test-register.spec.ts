import { test, expect } from '@playwright/test'

test('注册测试', async ({ page }) => {
  const random = Date.now()
  const username = `test${random}`
  const email = `${username}@test.com`
  
  await page.goto('/register')
  await page.waitForLoadState('networkidle')
  
  await page.fill('input[placeholder="用户名"]', username)
  await page.fill('input[placeholder="邮箱"]', email)
  await page.fill('input[placeholder="显示名称（可选）"]', username)
  await page.fill('input[placeholder="密码（至少6位）"]', 'password123')
  await page.fill('input[placeholder="确认密码"]', 'password123')
  
  const checkbox = page.locator('.el-checkbox')
  await checkbox.click()
  await page.waitForTimeout(500)
  
  await page.click('button:has-text("注 册")')
  await page.waitForTimeout(3000)
  
  const currentUrl = page.url()
  console.log('当前URL:', currentUrl)
  
  const errorMessage = await page.locator('.el-message').first().textContent().catch(() => null)
  if (errorMessage) {
    console.log('错误消息:', errorMessage)
  }
  
  expect(currentUrl).toContain('/login')
})
