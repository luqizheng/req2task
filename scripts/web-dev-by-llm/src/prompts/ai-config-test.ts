import { TestCredentials } from '../types';

export function generateAiConfigTestPrompt(credentials: TestCredentials): string {
  return `# AI配置管理自动化测试任务

## 任务概述
采用 Chrome MCP 测试 AI配置管理模块，完成完整的 CRUD 测试流程。

## 登录信息
- 用户名: ${credentials.username}
- 密码: ${credentials.password}
- 目标URL: http://localhost:3001

## 测试环境
- 浏览器: Chrome (通过 MCP 控制)
- 测试框架: Playwright/Selenium (由 MCP 驱动)

## 测试流程

### 1. 登录系统
使用以下凭据登录:
- 输入用户名: ${credentials.username}
- 输入密码: ${credentials.password}
- 点击登录按钮
- 验证登录成功，进入仪表盘

### 2. 导航到AI配置管理页面
- 在侧边栏找到"AI配置"或"系统设置"菜单
- 点击进入AI配置管理页面
- 验证页面正确加载，显示AI配置列表

### 3. 创建AI配置测试
- 点击"新建"或"添加"按钮
- 填写配置信息:
  - 配置名称: Test-AI-Config-{timestamp}
  - 提供商: OpenAI / Claude / 自定义
  - 模型: gpt-4 / claude-3-opus
  - API Key: sk-test-xxxxx
- 点击保存按钮
- 验证新配置出现在列表中

### 4. 修改AI配置测试
- 在配置列表中找到刚才创建的配置
- 点击编辑按钮
- 修改配置名称为: Test-AI-Config-Updated-{timestamp}
- 点击保存
- 验证列表中的配置名称已更新

### 5. 删除AI配置测试
- 在配置列表中找到修改后的配置
- 点击删除按钮
- 确认删除操作
- 验证配置从列表中消失

## 预期结果
1. 登录成功，显示用户仪表盘
2. AI配置页面正常显示
3. 创建操作成功，新配置出现在列表
4. 修改操作成功，配置名称正确更新
5. 删除操作成功，配置从列表移除
6. 每步操作后截图保存

## 截图要求
每个测试步骤完成后，保存截图到 /tmp 目录:
- /tmp/login-success.png
- /tmp/ai-config-list.png
- /tmp/create-config-success.png
- /tmp/update-config-success.png
- /tmp/delete-config-success.png

## 输出格式
完成后请输出 JSON 格式的测试结果:
\`\`\`json
{
  "suite": "AI配置管理测试",
  "passed": 5,
  "failed": 0,
  "skipped": 0,
  "results": [
    {"step": "登录系统", "status": "passed", "screenshot": "/tmp/login-success.png"},
    {"step": "导航到AI配置", "status": "passed", "screenshot": "/tmp/ai-config-list.png"},
    {"step": "创建配置", "status": "passed", "screenshot": "/tmp/create-config-success.png"},
    {"step": "修改配置", "status": "passed", "screenshot": "/tmp/update-config-success.png"},
    {"step": "删除配置", "status": "passed", "screenshot": "/tmp/delete-config-success.png"}
  ],
  "summary": "所有测试通过"
}
\`\`\`
`;
}
