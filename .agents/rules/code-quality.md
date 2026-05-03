# 代码质量检查规则

项目使用增强的 ESLint 规则来保证代码质量。

## 必须遵守的规则

1. **no-console 规则**：禁止使用 `console.log`，只允许 `console.warn` 和 `console.error`
   - 错误示例：`console.log('debug info')`
   - 正确示例：`console.warn('warning')` 或 `console.error('error message')`

2. **no-debugger 规则**：禁止使用 `debugger` 语句

3. **no-unused-vars 规则**：禁止未使用的变量和导入
   - 变量名以下划线 `_` 开头可豁免：`const _unusedVar = 'test'`
   - 函数参数以下划线 `_` 开头可豁免：`function test(_unusedParam: string) {}`

4. **no-explicit-any 规则**：警告使用 `any` 类型，推荐使用具体类型

## 自动修复工具

```bash
# 扫描所有包的 lint 问题
pnpm lint:check

# 自动修复所有包的 lint 问题
pnpm lint:fix

# 专门检测和移除未使用的导入
pnpm lint:remove-unused              # 检测（默认扫描后端）
pnpm lint:remove-unused --web        # 检测前端
pnpm lint:remove-unused --service    # 检测后端
pnpm lint:remove-unused --packages   # 检测 packages
pnpm lint:remove-unused --all        # 检测所有包
pnpm lint:remove-unused:fix          # 自动移除未使用的导入
```

## 豁免规则的文件

以下文件的 `no-console` 规则被豁免：
- 所有 `*.spec.ts` 测试文件
- 所有 `*.test.ts` 测试文件

## 配置文件位置

- 前端：`apps/web/eslint.config.js`（ESLint 9 flat config）
- 后端：`apps/service/.eslintrc.cjs`（ESLint 8 rc config）
- 其他包：各自的 `.eslintrc.cjs`
