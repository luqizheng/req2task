import { test, expect, request } from '@playwright/test'

const API_BASE = 'http://localhost:4000'

test.describe('登录功能', () => {
  test('登录成功', async ({ page }) => {
    await page.goto('/login')

    await page.fill('input[placeholder="用户名"]', 'testuser')
    await page.fill('input[type="password"]', 'password123')

    await page.click('button:has-text("登 录")')

    await page.waitForURL('/dashboard')
    await expect(page.url()).toContain('/dashboard')
  })

  test('登录失败 - 用户名不存在', async ({ page }) => {
    await page.goto('/login')

    await page.fill('input[placeholder="用户名"]', 'nonexistent')
    await page.fill('input[type="password"]', 'wrongpassword')

    await page.click('button:has-text("登 录")')

    await expect(page.locator('.el-message')).toContainText('登录失败')
  })

  test('登录失败 - 密码错误', async ({ page }) => {
    await page.goto('/login')

    await page.fill('input[placeholder="用户名"]', 'testuser')
    await page.fill('input[type="password"]', 'wrongpassword')

    await page.click('button:has-text("登 录")')

    await expect(page.locator('.el-message')).toContainText('登录失败')
  })

  test('登录失败 - 用户名为空', async ({ page }) => {
    await page.goto('/login')

    await page.fill('input[type="password"]', 'password123')

    await page.click('button:has-text("登 录")')

    await expect(page.locator('.el-form-item__error')).toContainText('请输入用户名')
  })

  test('登录失败 - 密码为空', async ({ page }) => {
    await page.goto('/login')

    await page.fill('input[placeholder="用户名"]', 'testuser')

    await page.click('button:has-text("登 录")')

    await expect(page.locator('.el-form-item__error')).toContainText('请输入密码')
  })
})

test.describe('注册功能', () => {
  test('注册成功', async ({ page }) => {
    const random = Date.now()
    const username = `newuser${random}`
    const email = `${username}@test.com`

    await page.goto('/register')

    await page.fill('input[placeholder="用户名"]', username)
    await page.fill('input[placeholder="邮箱"]', email)
    await page.fill('input[placeholder="密码（至少6位）"]', 'password123')
    await page.fill('input[placeholder="确认密码"]', 'password123')
    await page.check('input[type="checkbox"]')

    await page.click('button:has-text("注 册")')

    await expect(page.locator('.el-message')).toContainText('注册成功')
    await page.waitForURL('/login')
    await expect(page.url()).toContain('/login')
  })

  test('注册失败 - 用户名已存在', async ({ page }) => {
    await page.goto('/register')

    await page.fill('input[placeholder="用户名"]', 'testuser')
    await page.fill('input[placeholder="邮箱"]', 'newemail@test.com')
    await page.fill('input[placeholder="密码（至少6位）"]', 'password123')
    await page.fill('input[placeholder="确认密码"]', 'password123')
    await page.check('input[type="checkbox"]')

    await page.click('button:has-text("注 册")')

    await expect(page.locator('.el-message')).toContainText('注册失败')
  })

  test('注册失败 - 邮箱格式错误', async ({ page }) => {
    const random = Date.now()
    const username = `user${random}`

    await page.goto('/register')

    await page.fill('input[placeholder="用户名"]', username)
    await page.fill('input[placeholder="邮箱"]', 'invalid-email')
    await page.fill('input[placeholder="密码（至少6位）"]', 'password123')
    await page.fill('input[placeholder="确认密码"]', 'password123')

    await page.click('button:has-text("注 册")')

    await expect(page.locator('.el-form-item__error')).toContainText('邮箱格式')
  })

  test('注册失败 - 密码长度不足', async ({ page }) => {
    const random = Date.now()
    const username = `user${random}`

    await page.goto('/register')

    await page.fill('input[placeholder="用户名"]', username)
    await page.fill('input[placeholder="邮箱"]', `${username}@test.com`)
    await page.fill('input[placeholder="密码（至少6位）"]', '123')
    await page.fill('input[placeholder="确认密码"]', '123')

    await page.click('button:has-text("注 册")')

    await expect(page.locator('.el-form-item__error')).toContainText('至少6位')
  })

  test('注册失败 - 两次密码不一致', async ({ page }) => {
    const random = Date.now()
    const username = `user${random}`

    await page.goto('/register')

    await page.fill('input[placeholder="用户名"]', username)
    await page.fill('input[placeholder="邮箱"]', `${username}@test.com`)
    await page.fill('input[placeholder="密码（至少6位）"]', 'password123')
    await page.fill('input[placeholder="确认密码"]', 'differentpassword')

    await page.click('button:has-text("注 册")')

    await expect(page.locator('.el-form-item__error')).toContainText('不一致')
  })

  test('注册失败 - 未同意用户协议', async ({ page }) => {
    const random = Date.now()
    const username = `user${random}`

    await page.goto('/register')

    await page.fill('input[placeholder="用户名"]', username)
    await page.fill('input[placeholder="邮箱"]', `${username}@test.com`)
    await page.fill('input[placeholder="密码（至少6位）"]', 'password123')
    await page.fill('input[placeholder="确认密码"]', 'password123')

    await page.click('button:has-text("注 册")')

    await expect(page.locator('.el-message')).toContainText('用户协议')
  })
})

test.describe('路由守卫', () => {
  test('未登录访问 dashboard 应重定向到登录页', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.url()).toContain('/login')
  })

  test('已登录用户访问登录页应跳转到 dashboard', async ({ page, context }) => {
    await context.addCookies([
      {
        name: 'accessToken',
        value: 'fake-token',
        domain: 'localhost',
        path: '/'
      }
    ])

    await page.goto('/login')
    await expect(page.url()).toContain('/dashboard')
  })
})