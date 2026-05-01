# 项目代码质量工具计划：检测和修复未使用代码

## 目标
为项目添加工具，自动检测和修复以下问题：
1. 未使用的变量
2. 未使用的类型
3. 未使用的导入
4. console.log 和 debug 语句

## 保留的输出
- console.warn
- console.error
- console.debug（可选）

## 当前状态
- 前端 (web): ESLint 9 + `eslint.config.js`，已有 `@typescript-eslint/no-unused-vars`
- 后端 (service): ESLint 8 + `.eslintrc.cjs`，已有 `@typescript-eslint/no-unused-vars`
- 各子包均有独立 ESLint 配置

## 缺失功能
1. 未使用的导入检测（需要 `import/no-unused-imports`）
2. 未使用的类型检测（需要配置 `unusedImports` 和 `unusedVariableLocals`）
3. 未使用的导出检测
4. console.log 检测
5. debug 语句检测
6. 自动修复脚本

---

## 实施计划

### 1. 增强前端 ESLint 配置
**文件**: `apps/web/eslint.config.js`
- 添加 `import/no-unused-imports` 规则
- 配置 `@typescript-eslint/no-unused-vars` 支持类型
- 启用自动修复

### 2. 增强后端 ESLint 配置
**文件**: `apps/service/.eslintrc.cjs`
- 添加 `import/no-unused-imports` 规则
- 配置类型检测规则
- 更新覆盖规则

### 3. 增强其他包 ESLint 配置
**文件**:
- `packages/core/.eslintrc.cjs`
- `packages/dto/.eslintrc.cjs`
- `apps/ai-chat-service/.eslintrc.cjs`
- `apps/file-conversion/.eslintrc.cjs`

### 4. 创建统一 lint 脚本
**文件**: `scripts/lint-fix.ts`
- 扫描所有包
- 运行 lint 检查
- 汇总报告

### 5. 添加新脚本到 package.json
**文件**: `package.json`
- 添加 `pnpm lint:fix-unused` 命令
- 添加 `pnpm lint:report` 命令生成报告

---

## 规则配置详情

### @typescript-eslint/no-unused-vars 增强配置
```javascript
"@typescript-eslint/no-unused-vars": [
  "error",
  {
    "argsIgnorePattern": "^_",
    "varsIgnorePattern": "^_",
    "caughtErrorsIgnorePattern": "^_",
    "destructuredArrayIgnorePattern": "^_",
    "ignoreRestSiblings": true,
    "args": "after-used",
    "caughtErrors": "all"
  }
]
```

### import/no-unused-imports 配置
```javascript
"import/no-unused-imports": "error"
```

### @typescript-eslint/no-unused-imports 配置（ESLint 9）
```javascript
"@typescript-eslint/no-unused-imports": "error"
```

### no-console 配置
```javascript
"no-console": ["error", { "allow": ["warn", "error"] }]
```

### no-debugger 配置
```javascript
"no-debugger": "error"
```

---

## 实施步骤

1. 更新 `apps/web/eslint.config.js` - 增强配置
2. 更新 `apps/service/.eslintrc.cjs` - 增强配置
3. 更新 `packages/core/.eslintrc.cjs` - 增强配置
4. 更新 `packages/dto/.eslintrc.cjs` - 增强配置
5. 更新 `apps/ai-chat-service/.eslintrc.cjs` - 增强配置
6. 更新 `apps/file-conversion/.eslintrc.cjs` - 增强配置
7. 创建 `scripts/lint-fix.ts` - 统一 lint 脚本
8. 更新根 `package.json` - 添加新脚本
9. 测试验证

---

## 预期效果
- 运行 `pnpm lint` 时自动检测未使用的导入、console.log、debugger
- 运行 `pnpm lint --fix` 时自动修复这些问题
- 提交前通过 lint-staged 自动修复
- 保持与现有规则的兼容性
