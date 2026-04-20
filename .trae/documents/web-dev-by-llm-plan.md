# Web LLM 自动化测试框架计划

## 目标
在 `scripts` 目录创建 `web-dev-by-llm` 模块，通过 LLM + Chrome MCP 实现 Web 功能自动化测试。

## 目录结构
```
scripts/web-dev-by-llm/
├── src/
│   ├── index.ts              # 主入口，CLI 交互
│   ├── prompts/
│   │   └── ai-config-test.md # AI配置管理测试提示词
│   ├── test-cases/
│   │   └── ai-config.ts      # AI配置管理测试用例
│   ├── reporters/
│   │   └── test-report.ts    # 测试报告生成
│   └── types/
│       └── index.ts          # 类型定义
├── tsconfig.json
└── package.json
```

## 实现步骤

### 1. 初始化模块
- 创建目录结构
- 初始化 `package.json` 和 `tsconfig.json`

### 2. 主入口 `src/index.ts`
- 询问用户登录账号密码（默认 leo/admin123）
- 用户确认后，调用 MCP 命令执行测试

### 3. AI配置管理测试提示词
```markdown
## 任务描述
采用 Chrome MCP 测试 AI配置管理模块，登录/密码是 {username}/{password}。

## 测试流程
1. 登录系统
2. 导航到AI配置管理页面
3. 测试用例（增删改查）：
   - 创建新的AI配置
   - 修改已有配置
   - 删除配置
4. 每步验证执行结果
5. 生成测试报告

## 预期结果
- 登录成功进入仪表盘
- AI配置列表正常显示
- 创建/修改/删除操作成功
- 操作后列表状态正确
```

### 4. 测试用例模块
- 定义 AI 配置管理测试类
- 包含 login、create、update、delete 方法
- 返回测试结果对象

### 5. 报告生成器
- 汇总测试结果
- 输出 JSON/HTML 格式报告
- 包含：通过率、耗时、错误详情

### 6. MCP 集成
- 使用 `npx @anthropic/mcp-dev` 或类似工具
- 通过命令行调用 Chrome 进行自动化操作
- 获取执行结果并解析

## 核心命令
```bash
# 启动 MCP Chrome 会话
npx @anthropic/mcp-dev chrome

# 执行测试
pnpm web-dev-by-llm --test ai-config --user leo --pass admin123
```

## 输出
- 测试通过后生成报告文件
- 报告路径：`test-reports/ai-config-{timestamp}.html`
