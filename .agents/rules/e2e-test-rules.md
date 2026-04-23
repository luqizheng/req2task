# E2E 测试规则

## 1. 测试范围

### 必须覆盖的场景

| 场景类型 | 描述 | 优先级 |
|---------|------|--------|
| 认证流程 | 登录、注册、登出、Token 失效处理 | P0 |
| 路由守卫 | 未登录访问需认证页面重定向 | P0 |
| 核心页面 | Dashboard、需求列表、任务看板 | P0 |
| CRUD 操作 | 需求创建/编辑/删除、任务创建/编辑/删除 | P1 |
| 表单验证 | 必填项、格式校验、长度限制 | P1 |
| 业务逻辑 | 需求状态流转、任务状态变更、基线管理 | P1 |
| 响应式布局 | Desktop/Mobile 视图适配 | P2 |
| AI 功能 | AI 需求生成、对话交互 | P2 |

### 页面覆盖清单

```
首页相关:
- 首页渲染、导航按钮
- 登录页: 表单验证、登录成功/失败
- 注册页: 表单验证、注册成功/失败

认证后页面:
- Dashboard: 数据加载、统计展示
- 项目列表: 列表渲染、搜索、筛选
- 项目详情: 需求列表、任务概览
- 需求列表: 列表渲染、创建、筛选、详情
- 需求详情: 信息展示、状态变更
- 任务看板: 看板渲染、拖拽状态变更
- 任务详情: 信息展示、编辑
- AI 需求生成: 表单填写、结果展示
- AI 聊天: 对话交互
- 用户管理: 用户列表、角色管理
- 基线管理: 基线创建、版本对比
- 项目进度: 进度展示
```

## 2. 测试文件组织

```
apps/web/e2e/
├── pages/                    # Page Object 模式
│   ├── LoginPage.ts
│   ├── RegisterPage.ts
│   ├── DashboardPage.ts
│   ├── ProjectListPage.ts
│   └── ...
├── fixtures/                 # 测试数据
│   └── test-data.ts
├── auth.spec.ts             # 认证相关
├── home.spec.ts             # 首页相关
├── project.spec.ts          # 项目管理
├── requirement.spec.ts      # 需求管理
├── task.spec.ts             # 任务管理
├── ai.spec.ts               # AI 功能
└── utils/                   # 工具函数
    └── test-helpers.ts
```

## 3. 测试编写规范

### 3.1 Page Object 模式

```typescript
// e2e/pages/LoginPage.ts
import { Page, Locator } from '@playwright/test'

export class LoginPage {
  readonly page: Page
  readonly usernameInput: Locator
  readonly passwordInput: Locator
  readonly submitButton: Locator
  readonly errorMessage: Locator

  constructor(page: Page) {
    this.page = page
    this.usernameInput = page.locator('input[placeholder="用户名"]')
    this.passwordInput = page.locator('input[type="password"]')
    this.submitButton = page.locator('button:has-text("登 录")')
    this.errorMessage = page.locator('.el-message')
  }

  async goto() {
    await this.page.goto('/login')
  }

  async login(username: string, password: string) {
    await this.usernameInput.fill(username)
    await this.passwordInput.fill(password)
    await this.submitButton.click()
  }
}
```

### 3.2 测试用例命名

- 格式: `功能_操作_预期结果`
- 示例:
  - `登录_正确凭据_跳转Dashboard`
  - `注册_邮箱格式错误_显示格式错误提示`
  - `需求列表_筛选状态_正确过滤列表`

### 3.3 Locator 优先级

1. `getByRole` - 无障碍角色（最可靠）
2. `getByLabel` - 表单标签
3. `getByText` - 文本内容
4. `getByTestId` - data-testid 属性
5. CSS 选择器 - 最后选择

### 3.4 断言规范

```typescript
// 积极断言
await expect(page.locator('.title')).toHaveText('预期标题')
await expect(page.locator('.list')).toHaveCount(5)

// 消极断言
await expect(page.locator('.error')).not.toBeVisible()
await expect(page.url()).not.toContain('/error')

// 等待断言
await expect(page.locator('.loading')).toBeHidden({ timeout: 5000 })
```

### 3.5 测试数据管理

采用**全局测试账号 + 动态数据**方案：

```typescript
// e2e/fixtures/test-data.ts

// 全局固定测试账号（环境变量或固定值）
export const GLOBAL_TEST_USER = {
  username: process.env.E2E_TEST_USERNAME || 'e2e_test_user',
  password: process.env.E2E_TEST_PASSWORD || 'e2e_test_pass_123'
}

// 动态生成唯一标识（用于隔离并发测试）
export const generateUnique = (prefix: string) => ({
  username: `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  email: `${prefix}_${Date.now()}@e2e.test.com`,
  projectName: `${prefix}_项目_${Date.now()}`
})

// 测试项目模板
export const TEST_PROJECT = {
  name: `测试项目_${Date.now()}`,
  description: 'E2E 测试用项目'
}
```

**关键原则**：
- 登录认证使用全局固定账号（避免每个测试都注册）
- 需要唯一性的数据（如邮箱、项目名）使用时间戳+随机数
- 全局账号密码通过环境变量配置，不提交到代码库

## 4. 配置要求

### 4.1 Playwright 配置扩展

```typescript
// playwright.config.ts 需增加:
{
  use: {
    // 截图模式
    screenshot: 'only-on-failure',
    // 视频录制
    video: 'retain-on-failure',
    // 跟踪数据
    trace: 'on-first-retry',
    // 页面超时
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },
  // 多浏览器支持
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  ],
}
```

### 4.2 CI 配置

```yaml
# .github/workflows/e2e.yml
test:e2e:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: pnpm/action-setup@v2
    - run: pnpm install --frozen-lockfile
    - run: pnpm test:e2e
```

## 5. 测试执行

### 5.1 本地执行

```bash
pnpm test:e2e              # 运行所有
pnpm test:e2e --headed      # 可视化运行
pnpm test:e2e --debug       # 调试模式
pnpm test:e2e auth.spec.ts  # 单个文件
```

### 5.2 条件执行

```typescript
test.skip('跳过此测试', async ({ page }) => { })
test.only('仅运行此测试', async ({ page }) => { })
test.fixme('标记为待修复', async ({ page }) => { })
```

## 6. 数据准备与清理

### 6.1 测试账号初始化

```typescript
// e2e/fixtures/auth-setup.ts
import { test as base } from '@playwright/test'
import { GLOBAL_TEST_USER } from './test-data'

// 扩展 test fixture，添加 authenticatedPage
export const test = base.extend<{
  authenticatedPage: { page: Page }
}>({
  authenticatedPage: async ({ page }, use) => {
    await page.goto('/login')
    await page.fill('input[placeholder="用户名"]', GLOBAL_TEST_USER.username)
    await page.fill('input[type="password"]', GLOBAL_TEST_USER.password)
    await page.click('button:has-text("登 录")')
    await page.waitForURL('/dashboard')
    await use({ page })
    await page.click('button:has-text("退出")')
  }
})
```

### 6.2 使用方式

```typescript
// e2e/project.spec.ts
import { test, expect } from '@playwright/test'
import { authenticatedPage } from './fixtures/auth-setup'
import { generateUnique } from './fixtures/test-data'

// 认证后的测试直接使用 authenticatedPage
test('创建项目', async ({ authenticatedPage }) => {
  const { page } = authenticatedPage
  const projectData = generateUnique('项目')

  await page.goto('/projects')
  await page.click('button:has-text("新建项目")')
  await page.fill('input[placeholder="项目名称"]', projectData.projectName)
  await page.click('button:has-text("确 定")')

  await expect(page.locator('.el-message')).toContainText('创建成功')
})

// 无需认证的测试使用普通 page
test('未登录访问项目列表应重定向', async ({ page }) => {
  await page.goto('/projects')
  await expect(page.url()).toContain('/login')
})
```

### 6.3 环境变量配置

```bash
# apps/web/.env.e2e
E2E_TEST_USERNAME=e2e_test_user
E2E_TEST_PASSWORD=e2e_test_pass_123
```

启动 E2E 测试前确保数据库中存在该测试账号（可通过数据库迁移脚本初始化）。

## 7. 性能与稳定性

- 单个测试控制在 30 秒内
- 使用 `waitForURL` 替代固定 `waitForTimeout`
- 避免依赖特定执行顺序
- 使用 `test.describe.serial` 处理有依赖的测试

## 8. 禁止事项

- 禁止硬编码非测试数据
- 禁止跳过错误断言
- 禁止测试间共享状态
- 禁止使用 sleep 固定等待
- 禁止在生产环境运行 E2E 测试
