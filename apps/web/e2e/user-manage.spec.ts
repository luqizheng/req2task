import { test, expect } from '@playwright/test'

test.describe('用户管理功能', () => {
  test.beforeEach(async ({ page }) => {
    const random = Date.now()
    const username = `admin${random}`
    const email = `${username}@test.com`
    
    await page.goto('/register')
    await page.waitForLoadState('networkidle')
    
    await page.fill('input[placeholder="用户名"]', username)
    await page.fill('input[placeholder="邮箱"]', email)
    await page.fill('input[placeholder="显示名称（可选）"]', username)
    await page.fill('input[placeholder="密码（至少6位）"]', 'password123')
    await page.fill('input[placeholder="确认密码"]', 'password123')
    await page.locator('.el-checkbox').click()
    await page.click('button:has-text("注 册")')
    await page.waitForURL('/login', { timeout: 15000 })
    
    await page.fill('input[placeholder="用户名"]', username)
    await page.fill('input[type="password"]', 'password123')
    await page.click('button:has-text("登 录")')
    await page.waitForURL('/dashboard', { timeout: 15000 })
    
    await page.goto('/users')
    await page.waitForSelector('.el-table', { timeout: 15000 })
  })

  test('用户列表正确显示', async ({ page }) => {
    await expect(page.locator('.page-title')).toHaveText('用户管理')
    await expect(page.locator('.el-table')).toBeVisible()
    await expect(page.locator('.el-button:has-text("添加用户")')).toBeVisible()
  })

  test('搜索功能 - 关键词搜索', async ({ page }) => {
    await page.click('button:has-text("添加用户")')
    await page.waitForSelector('.el-dialog', { timeout: 5000 })
    await expect(page.locator('.el-dialog')).toBeVisible()
    
    const random = Date.now()
    const username = `searchuser${random}`
    
    await page.fill('input[placeholder="请输入用户名"]', username)
    await page.fill('input[placeholder="请输入姓名"]', '搜索测试用户')
    await page.fill('input[placeholder="请输入邮箱"]', `${username}@test.com`)
    await page.locator('.el-select').nth(0).click()
    await page.locator('.el-select-dropdown__item').first().click()
    await page.fill('input[placeholder="请输入密码"]', 'password123')
    
    await page.click('button:has-text("确 定")')
    await page.waitForTimeout(1000)
    
    await expect(page.locator('.el-message')).toContainText('添加成功')
    
    await page.fill('input[placeholder="用户名/姓名/邮箱"]', username)
    await page.click('button:has-text("搜索")')
    await page.waitForTimeout(1000)
    
    const rows = page.locator('.el-table__body-wrapper tbody tr')
    const count = await rows.count()
    expect(count).toBeGreaterThan(0)
  })

  test('重置筛选条件', async ({ page }) => {
    await page.fill('input[placeholder="用户名/姓名/邮箱"]', 'test')
    
    const roleSelect = page.locator('.filter-form .el-select').first()
    await roleSelect.click()
    await page.waitForTimeout(300)
    
    await page.click('button:has-text("重置")')
    
    await expect(page.locator('input[placeholder="用户名/姓名/邮箱"]')).toHaveValue('')
  })

  test('添加用户 - 成功添加', async ({ page }) => {
    const random = Date.now()
    const username = `newuser${random}`
    
    await page.click('button:has-text("添加用户")')
    await page.waitForSelector('.el-dialog', { timeout: 5000 })
    await expect(page.locator('.el-dialog')).toBeVisible()
    await expect(page.locator('.el-dialog__title')).toContainText('添加用户')
    
    await page.fill('input[placeholder="请输入用户名"]', username)
    await page.fill('input[placeholder="请输入姓名"]', '测试用户')
    await page.fill('input[placeholder="请输入邮箱"]', `${username}@test.com`)
    
    const roleSelect = page.locator('.el-dialog .el-select').first()
    await roleSelect.click()
    await page.waitForTimeout(300)
    await page.locator('.el-select-dropdown__item').first().click()
    
    await page.fill('input[placeholder="请输入密码"]', 'password123')
    
    await page.click('button:has-text("确 定")')
    await page.waitForTimeout(1000)
    
    await expect(page.locator('.el-message')).toContainText('添加成功')
  })

  test('添加用户 - 表单验证', async ({ page }) => {
    await page.click('button:has-text("添加用户")')
    
    await page.click('button:has-text("确 定")')
    
    await expect(page.locator('.el-form-item__error').first()).toBeVisible()
  })

  test('编辑用户', async ({ page }) => {
    const random = Date.now()
    const username = `edituser${random}`
    
    await page.click('button:has-text("添加用户")')
    await page.waitForSelector('.el-dialog', { timeout: 5000 })
    await page.fill('input[placeholder="请输入用户名"]', username)
    await page.fill('input[placeholder="请输入姓名"]', '编辑测试用户')
    await page.fill('input[placeholder="请输入邮箱"]', `${username}@test.com`)
    const roleSelect = page.locator('.el-dialog .el-select').first()
    await roleSelect.click()
    await page.waitForTimeout(300)
    await page.locator('.el-select-dropdown__item').first().click()
    await page.fill('input[placeholder="请输入密码"]', 'password123')
    await page.click('button:has-text("确 定")')
    await page.waitForTimeout(1000)
    
    await page.fill('input[placeholder="用户名/姓名/邮箱"]', username)
    await page.click('button:has-text("搜索")')
    await page.waitForTimeout(1000)
    
    const firstRow = page.locator('.el-table__body-wrapper tbody tr').first()
    await firstRow.locator('button:has-text("编辑")').click()
    
    await expect(page.locator('.el-dialog__title')).toContainText('编辑用户')
    
    await page.fill('input[placeholder="请输入姓名"]', '更新后的姓名')
    
    await page.click('button:has-text("确 定")')
    await page.waitForTimeout(1000)
    
    await expect(page.locator('.el-message')).toContainText('更新成功')
  })

  test('删除用户 - 确认取消', async ({ page }) => {
    const random = Date.now()
    const username = `deleteuser${random}`
    
    await page.click('button:has-text("添加用户")')
    await page.waitForSelector('.el-dialog', { timeout: 5000 })
    await page.fill('input[placeholder="请输入用户名"]', username)
    await page.fill('input[placeholder="请输入姓名"]', '删除测试用户')
    await page.fill('input[placeholder="请输入邮箱"]', `${username}@test.com`)
    const roleSelect = page.locator('.el-dialog .el-select').first()
    await roleSelect.click()
    await page.waitForTimeout(300)
    await page.locator('.el-select-dropdown__item').first().click()
    await page.fill('input[placeholder="请输入密码"]', 'password123')
    await page.click('button:has-text("确 定")')
    await page.waitForTimeout(1000)
    
    const initialCount = await page.locator('.el-table__body-wrapper tbody tr').count()
    
    await page.fill('input[placeholder="用户名/姓名/邮箱"]', username)
    await page.click('button:has-text("搜索")')
    await page.waitForTimeout(1000)
    
    const firstRow = page.locator('.el-table__body-wrapper tbody tr').first()
    await firstRow.locator('button:has-text("删除")').click()
    
    await expect(page.locator('.el-message-box')).toBeVisible()
    await page.click('button:has-text("取消")')
    
    const finalCount = await page.locator('.el-table__body-wrapper tbody tr').count()
    expect(finalCount).toBe(initialCount)
  })

  test('分页功能', async ({ page }) => {
    const pagination = page.locator('.el-pagination')
    await expect(pagination).toBeVisible()
    
    const pageButton = pagination.locator('button.number').nth(1)
    if (await pageButton.isVisible()) {
      await pageButton.click()
      await page.waitForTimeout(500)
    }
  })
})
