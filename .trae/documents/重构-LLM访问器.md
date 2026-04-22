# 重构 LLM 访问器计划

## 目标
使用 `@themaximalist/llm.js` 重构 LLM 访问层，删除旧的 provider 封装。

## 删除文件清单

| 文件/目录 | 说明 |
|-----------|------|
| `src/llm/` | 整个目录，包含 providers, factory 等 |
| `src/llm/**/*.spec.ts` | 所有测试文件 |

## 新建文件

### 1. `src/services/llm.service.ts`
使用 `@themaximalist/llm.js` 封装 LLM 服务：

```typescript
import LLM from '@themaximalist/llm.js';
import type { Message, FileAttachment } from '../types.js';

export interface LLMResponse {
  content: string;
  usage?: { input_tokens: number; output_tokens: number; total_cost: number };
}

export interface StreamChunk {
  content: string;
  done: boolean;
}

export class LLMService {
  private llm: typeof LLM;
  private defaultModel: string;

  constructor(defaultModel: string = 'gpt-4o-mini') {
    this.defaultModel = defaultModel;
    this.llm = LLM;
  }

  async complete(
    messages: Message[],
    model?: string,
    files?: FileAttachment[]
  ): Promise<LLMResponse>;

  async *streamComplete(
    messages: Message[],
    model?: string,
    files?: FileAttachment[]
  ): AsyncGenerator<StreamChunk>;

  // ... 实现
}
```

## 修改文件清单

| 文件 | 修改内容 |
|------|----------|
| `src/services/llm-config.service.ts` | 移除旧的 provider 引用 |
| `src/routes/conversation.routes.ts` | 更新 LLM 调用方式 |
| `src/app.ts` | 更新 LLMService 初始化 |
| `package.json` | 替换依赖 |

## 依赖变更

**移除：**
- `openai` - 使用 llm.js 内置
- `ollama` - 使用 llm.js 内置

**添加：**
- `@themaximalist/llm.js`

## API 映射

| 旧 API | 新 API |
|--------|--------|
| `openai.chat.completions.create()` | `LLM()` 或 `new LLM().chat()` |
| `stream: true` | `stream: true` |
| 手动处理文件 | 使用 `attachments` 参数 |

## 实施步骤

1. 安装 `@themaximalist/llm.js` 依赖
2. 创建新的 `src/services/llm.service.ts`
3. 修改 `src/app.ts` 使用新服务
4. 更新 `src/routes/conversation.routes.ts`
5. 删除 `src/llm/` 目录
6. 更新 `package.json` 依赖
7. TypeScript 类型检查
