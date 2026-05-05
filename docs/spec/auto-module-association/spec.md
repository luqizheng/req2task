# SPEC: 需求自动关联模块/自动创建功能

## 1. Objective

### 1.1 核心目标
实现需求与功能模块的智能关联，支持手动创建/编辑需求时自动推荐模块，以及 AI 生成需求时的模块确认流程。

### 1.2 用户故事

**场景一：手动创建需求**
```
作为 需求分析师
我想要 在创建需求时系统自动推荐匹配的模块
以便 我无需手动查找和选择模块，提升录入效率
```

**场景二：模块不存在时自动创建**
```
作为 需求分析师
我想要 当没有匹配模块时系统建议创建新模块
以便 我能确认后快速创建关联模块
```

**场景三：AI 生成需求模块确认**
```
作为 需求分析师
我想要 AI 生成的需求中，如果推荐创建新模块需要我确认
以便 我能控制模块结构的合理性
```

### 1.3 成功标准

| 编号 | 标准 | 验证方式 |
|------|------|----------|
| SC-01 | 手动创建需求时，输入标题/描述后自动推荐 Top 3 匹配模块 | 手动测试 |
| SC-02 | 推荐模块显示匹配置信度分数 | 手动测试 |
| SC-03 | 无匹配模块时显示"创建新模块"选项 | 手动测试 |
| SC-04 | 创建新模块需要用户输入名称和描述 | 手动测试 |
| SC-05 | AI 生成需求时，NEW 模块以待确认状态展示 | 手动测试 |
| SC-06 | AI 生成需求的模块确认支持批量处理 | 手动测试 |
| SC-07 | 关联的模块在需求详情页正确展示 | 手动测试 |

## 2. 技术栈

与现有项目一致：

- **前端**: Vue 3 + Vite + Pinia + Vue Router
- **后端**: NestJS + TypeORM + PostgreSQL
- **AI**: ChromaDB 向量存储 + Ollama Embedding
- **语言**: TypeScript

## 3. Commands

```bash
# 开发
pnpm dev:web          # 启动前端
pnpm dev:service      # 启动后端

# 构建
pnpm build:web        # 构建前端
pnpm build:service     # 构建后端

# 测试
pnpm test             # 运行所有测试
pnpm test --filter @req2task/service  # 后端测试
pnpm test --filter @req2task/web     # 前端测试

# Lint
pnpm lint             # 检查所有
pnpm lint --fix       # 自动修复
```

## 4. Project Structure

### 4.1 前端新增

```
apps/web/src/
├── components/
│   └── modules/
│       ├── ModuleSelector.vue          # 模块选择器组件
│       ├── ModuleAutoComplete.vue      # 模块自动推荐组件
│       └── CreateModuleDialog.vue      # 创建模块对话框
├── views/
│   └── RequirementDetailView/
│       └── components/
│           └── RequirementModules.vue   # 已有组件，新增推荐功能
└── api/
    └── modules.ts                      # 新增模块 API
```

### 4.2 后端新增

```
apps/service/src/
├── modules/
│   ├── modules.controller.ts           # 新增推荐接口
│   ├── modules.service.ts              # 新增推荐逻辑
│   └── dto/
│       ├── recommend-module.dto.ts      # 推荐请求/响应 DTO
│       └── create-module.dto.ts         # 创建模块 DTO
└── requirements/
    └── requirements.service.ts         # 新增 AI 生成需求模块确认处理
```

### 4.3 DTO 包新增

```
packages/dto/
├── recommend-module.dto.ts             # 前后端共享推荐 DTO
└── index.ts                           # 导出更新
```

## 5. Code Style

### 5.1 前端模块推荐组件示例

```typescript
// apps/web/src/components/modules/ModuleAutoComplete.vue
<script setup lang="ts">
import { ref, watch } from 'vue'
import { modulesApi } from '@/api/modules'
import type { ModuleRecommendResultDto } from '@req2task/dto'

const props = defineProps<{
  projectId: string
  requirementTitle?: string
  requirementDescription?: string
}>()

const emit = defineEmits<{
  select: [moduleId: string | null]
  create: [name: string, description: string]
}>()

const recommendations = ref<ModuleRecommendResultDto[]>([])
const isLoading = ref(false)
const debounceTimer = ref<ReturnType<typeof setTimeout>>()

watch(
  () => [props.requirementTitle, props.requirementDescription],
  () => {
    clearTimeout(debounceTimer.value)
    debounceTimer.value = setTimeout(fetchRecommendations, 300)
  }
)

async function fetchRecommendations() {
  const content = [props.requirementTitle, props.requirementDescription]
    .filter(Boolean)
    .join(' ')
  if (!content.trim()) {
    recommendations.value = []
    return
  }

  isLoading.value = true
  try {
    const result = await modulesApi.recommend(props.projectId, { content })
    recommendations.value = result
  } finally {
    isLoading.value = false
  }
}

function handleSelect(moduleId: string | null) {
  emit('select', moduleId)
}

function handleCreate() {
  emit('create', '', '')
}
</script>
```

### 5.2 后端模块推荐服务示例

```typescript
// apps/service/src/modules/modules.service.ts
@Injectable()
export class ModulesService {
  constructor(
    @InjectRepository(FeatureModule)
    private moduleRepository: Repository<FeatureModule>,
    private readonly vectorService: RequirementVectorService,
  ) {}

  async recommendModules(
    projectId: string,
    content: string,
    limit: number = 5,
  ): Promise<ModuleRecommendResultDto[]> {
    const [vectorResults, keywordResults] = await Promise.all([
      this.vectorService.searchSimilarModules(content, projectId, limit),
      this.searchByKeywords(content, projectId),
    ])

    const merged = this.mergeResults(vectorResults, keywordResults, limit)
    return merged
  }

  private async searchByKeywords(
    content: string,
    projectId: string,
  ): Promise<ModuleRecommendResultDto[]> {
    const keywords = this.extractKeywords(content)
    const modules = await this.moduleRepository.find({
      where: { projectId },
    })

    return modules
      .map((module) => {
        const score = this.calculateKeywordScore(module, keywords)
        return score > 0.3
          ? { moduleId: module.id, moduleName: module.name, score, isNew: false }
          : null
      })
      .filter(Boolean) as ModuleRecommendResultDto[]
  }

  private calculateKeywordScore(module: FeatureModule, keywords: string[]): number {
    const text = [
      module.name,
      module.description,
      ...(module.aliases || []),
      ...(module.keywords || []),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    const matchCount = keywords.filter((k) => text.includes(k.toLowerCase())).length
    return matchCount / keywords.length
  }

  private extractKeywords(content: string): string[] {
    return content
      .split(/[\s,，。、]+/)
      .filter((w) => w.length >= 2)
      .slice(0, 20)
  }
}
```

## 6. Testing Strategy

### 6.1 测试框架

- **后端**: Jest + Supertest
- **前端**: Vitest

### 6.2 测试分层

| 层级 | 测试内容 | 覆盖要求 |
|------|----------|----------|
| 单元测试 | 关键词提取、评分算法、结果合并 | 核心逻辑 100% |
| 集成测试 | API 端到端、向量检索集成 | 主要流程覆盖 |
| E2E 测试 | 用户手动创建需求流程 | 关键路径覆盖 |

### 6.3 测试文件位置

```
apps/service/src/modules/
├── modules.service.spec.ts
├── modules.controller.spec.ts
└── __fixtures__/
    └── mock-modules.ts

apps/web/src/components/modules/
├── ModuleAutoComplete.spec.ts
└── ModuleAutoComplete.e2e.ts
```

## 7. Boundaries

### 7.1 Always（必须遵守）

- 向量检索使用 ChromaDB，默认模型 `nomic-embed-text`
- 模块推荐结果限制 5 个，超过 5 个截断
- 创建模块时 `moduleKey` 自动生成（小写下划线格式）
- 评分低于 0.3 的模块不返回推荐
- NEW 模块默认放在根层级（parentId = null）

### 7.2 Ask First（需确认后再改）

- 修改向量检索的相似度阈值（当前 0.3）
- 修改模块推荐数量限制（当前 5）
- 修改 FeatureModule 实体的 keywords/aliases 字段

### 7.3 Never（禁止）

- 不允许删除已有模块关联的需求
- 不允许在没有用户确认的情况下自动创建模块
- 不允许修改已确认的模块关联

## 8. API 设计

### 8.1 模块推荐接口

```
POST /modules/recommend
Request:
{
  "content": "用户需求标题+描述的组合文本"
}

Response:
{
  "recommendations": [
    {
      "moduleId": "uuid",
      "moduleName": "用户管理",
      "score": 0.85,
      "isNew": false,
      "suggestedName": null,
      "suggestedDescription": null
    },
    {
      "moduleId": null,
      "moduleName": null,
      "score": 0,
      "isNew": true,
      "suggestedName": "权限管理",
      "suggestedDescription": "用户权限相关功能"
    }
  ]
}
```

### 8.2 模块创建接口（已有，扩展）

```
POST /modules
Request:
{
  "name": "权限管理",
  "description": "用户权限相关功能",
  "projectId": "uuid",
  "parentId": null,          // 新增：支持指定父模块
  "fromRecommendation": true // 新增：标记为从推荐创建
}
```

### 8.3 AI 生成需求模块确认接口

```
POST /requirements/ai-generated/confirm-modules
Request:
{
  "confirmations": [
    {
      "requirementId": "uuid",
      "moduleId": "uuid"  // null 表示创建新模块
    }
  ],
  "newModules": [  // 当有 moduleId 为 null 时必填
    {
      "suggestedName": "权限管理",
      "suggestedDescription": "用户权限相关功能",
      "requirementIds": ["uuid1", "uuid2"]
    }
  ]
}

Response:
{
  "updatedRequirements": [...],
  "createdModules": [...]
}
```

## 9. Open Questions

| # | 问题 | 决策 |
|---|------|------|
| OQ-01 | AI 生成需求时，如果 moduleId 为 "NEW"，前端如何展示确认界面？ | 在需求生成结果页添加批量模块确认区域 |
| OQ-02 | 用户手动创建需求时，是否需要实时推荐还是点击按钮触发？ | 采用实时推荐 + 防抖 300ms |
| OQ-03 | 模块创建时是否支持选择父模块？ | MVP 版本只支持根层级，后续迭代支持树形 |

## 10. 实现计划

### Phase 1: 后端基础 (1-2 天)
- [ ] 新增 `POST /modules/recommend` 接口
- [ ] 扩展 `ModulesService` 增加推荐逻辑
- [ ] 新增向量检索相似模块方法
- [ ] 单元测试覆盖

### Phase 2: 前端组件 (1-2 天)
- [ ] 实现 `ModuleAutoComplete` 组件
- [ ] 实现 `CreateModuleDialog` 组件
- [ ] 集成到需求编辑页面
- [ ] E2E 测试覆盖

### Phase 3: AI 生成流程 (1 天)
- [ ] 前端 AI 生成结果页添加模块确认区
- [ ] 后端新增模块确认接口
- [ ] 处理 NEW 模块创建逻辑
- [ ] 集成测试覆盖

### Phase 4: 优化 (0.5 天)
- [ ] 关键词提取算法优化
- [ ] 评分权重调整
- [ ] 文档更新
