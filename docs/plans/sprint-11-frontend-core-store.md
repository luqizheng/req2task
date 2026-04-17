# Sprint 11: 核心 Store 与页面

**计划类型**: 前端开发
**目标**: 补齐缺失的 Store 和页面
**预计时长**: 1 周 (约 4.5 人天)
**状态**: 🚧 进行中
**里程碑**: M6

---

## 1. 目标

- 新增 4 个 Store (userStory, acceptanceCriteria, rawRequirement, llmConfig)
- 新增 2 个页面 (RawRequirementCollectView, UserStoryManageView)
- 升级 AiConfigView (支持 LLM Config CRUD)
- 补充 API 模块

---

## 2. 任务列表

| 任务 | 类型 | 预估 | 优先级 | 状态 | 依赖 |
|------|------|------|--------|------|------|
| userStory Store | store | 4h | P0 | ⏳ | - |
| acceptanceCriteria Store | store | 4h | P0 | ⏳ | userStory Store |
| rawRequirement Store | store | 4h | P0 | ⏳ | - |
| llmConfig Store | store | 4h | P0 | ⏳ | - |
| userStory API 补充 | api | 1h | P0 | ⏳ | - |
| acceptanceCriteria API 补充 | api | 1h | P0 | ⏳ | - |
| rawRequirement API 补充 | api | 1h | P0 | ⏳ | - |
| llm API 补充 | api | 1h | P0 | ⏳ | - |
| RawRequirementCollectView | page | 8h | P0 | ⏳ | rawRequirement Store |
| UserStoryManageView | page | 4h | P0 | ⏳ | userStory Store |
| 升级 AiConfigView | page | 4h | P1 | ⏳ | llmConfig Store |

**总预估工时**: 36h

---

## 3. Store 设计

### 3.1 userStory Store

```typescript
// src/stores/userStory.ts
import { defineStore } from 'pinia'
import { requirementsApi } from '@/api/requirements'
import type { UserStoryResponseDto } from '@req2task/dto'

interface UserStoryState {
  userStories: UserStoryResponseDto[]
  currentStory: UserStoryResponseDto | null
  loading: boolean
}

export const useUserStoryStore = defineStore('userStory', {
  state: (): UserStoryState => ({
    userStories: [],
    currentStory: null,
    loading: false
  }),

  actions: {
    async fetchByRequirement(requirementId: string) {
      this.loading = true
      try {
        this.userStories = await requirementsApi.getUserStories(requirementId)
      } finally {
        this.loading = false
      }
    },

    async create(requirementId: string, data: CreateUserStoryDto) {
      const story = await requirementsApi.createUserStory(requirementId, data)
      this.userStories.push(story)
      return story
    },

    async update(id: string, data: UpdateUserStoryDto) {
      const story = await requirementsApi.updateUserStory(id, data)
      const index = this.userStories.findIndex(s => s.id === id)
      if (index !== -1) {
        this.userStories[index] = story
      }
      return story
    },

    async delete(id: string) {
      await requirementsApi.deleteUserStory(id)
      this.userStories = this.userStories.filter(s => s.id !== id)
    }
  }
})
```

### 3.2 acceptanceCriteria Store

```typescript
// src/stores/acceptanceCriteria.ts
import { defineStore } from 'pinia'
import { requirementsApi } from '@/api/requirements'
import type { AcceptanceCriteriaResponseDto } from '@req2task/dto'

interface AcceptanceCriteriaState {
  criteriaList: AcceptanceCriteriaResponseDto[]
  loading: boolean
}

export const useAcceptanceCriteriaStore = defineStore('acceptanceCriteria', {
  state: (): AcceptanceCriteriaState => ({
    criteriaList: [],
    loading: false
  }),

  actions: {
    async fetchByUserStory(userStoryId: string) {
      this.loading = true
      try {
        this.criteriaList = await requirementsApi.getAcceptanceCriteria(userStoryId)
      } finally {
        this.loading = false
      }
    },

    async create(userStoryId: string, data: CreateAcceptanceCriteriaDto) {
      const criteria = await requirementsApi.createAcceptanceCriteria(userStoryId, data)
      this.criteriaList.push(criteria)
      return criteria
    },

    async update(id: string, data: UpdateAcceptanceCriteriaDto) {
      const criteria = await requirementsApi.updateAcceptanceCriteria(id, data)
      const index = this.criteriaList.findIndex(c => c.id === id)
      if (index !== -1) {
        this.criteriaList[index] = criteria
      }
      return criteria
    },

    async delete(id: string) {
      await requirementsApi.deleteAcceptanceCriteria(id)
      this.criteriaList = this.criteriaList.filter(c => c.id !== id)
    }
  }
})
```

### 3.3 rawRequirement Store

```typescript
// src/stores/rawRequirement.ts
import { defineStore } from 'pinia'
import { aiApi } from '@/api/ai'
import type { RawRequirementResponse } from '@/api/ai'

interface RawRequirementState {
  collections: RawCollection[]
  requirements: RawRequirementResponse[]
  currentCollection: RawCollection | null
  loading: boolean
}

export const useRawRequirementStore = defineStore('rawRequirement', {
  state: (): RawRequirementState => ({
    collections: [],
    requirements: [],
    currentCollection: null,
    loading: false
  }),

  actions: {
    async fetchCollections(projectId: string) {
      this.loading = true
      try {
        this.collections = await aiApi.getRawCollections(projectId)
      } finally {
        this.loading = false
      }
    },

    async createCollection(projectId: string, data: CreateRawCollectionDto) {
      const collection = await aiApi.createRawCollection(projectId, data)
      this.collections.push(collection)
      return collection
    },

    async fetchRequirements(collectionId: string) {
      this.loading = true
      try {
        this.requirements = await aiApi.getRawRequirements(collectionId)
      } finally {
        this.loading = false
      }
    },

    async addRequirement(collectionId: string, content: string) {
      const requirement = await aiApi.createRawRequirement(collectionId, { content })
      this.requirements.push(requirement)
      return requirement
    },

    async generateFromRaw(id: string, configId?: string) {
      return await aiApi.generateFromRaw(id, configId)
    }
  }
})
```

### 3.4 llmConfig Store

```typescript
// src/stores/llmConfig.ts
import { defineStore } from 'pinia'
import { aiApi } from '@/api/ai'
import type { LLMConfigResponse } from '@/api/ai'

interface LLMConfigState {
  configs: LLMConfigResponse[]
  currentConfig: LLMConfigResponse | null
  loading: boolean
}

export const useLLMConfigStore = defineStore('llmConfig', {
  state: (): LLMConfigState => ({
    configs: [],
    currentConfig: null,
    loading: false
  }),

  actions: {
    async fetchAll() {
      this.loading = true
      try {
        this.configs = await aiApi.getLLMConfigs()
      } finally {
        this.loading = false
      }
    },

    async create(data: CreateLLMConfigDto) {
      const config = await aiApi.createLLMConfig(data)
      this.configs.push(config)
      return config
    },

    async update(id: string, data: UpdateLLMConfigDto) {
      const config = await aiApi.updateLLMConfig(id, data)
      const index = this.configs.findIndex(c => c.id === id)
      if (index !== -1) {
        this.configs[index] = config
      }
      return config
    },

    async delete(id: string) {
      await aiApi.deleteLLMConfig(id)
      this.configs = this.configs.filter(c => c.id !== id)
    },

    async setDefault(id: string) {
      await aiApi.setDefaultLLMConfig(id)
      this.configs = this.configs.map(c => ({
        ...c,
        isDefault: c.id === id
      }))
    }
  }
})
```

---

## 4. 页面设计

### 4.1 RawRequirementCollectView

**路由**: `/projects/:projectId/raw-requirements`

**功能**:
- 列表展示收集
- 创建新收集
- 查看收集详情
- 添加原始需求
- AI 转换为正式需求

**布局**:
```
┌─────────────────────────────────────────────────────────┐
│ 原始需求收集                                              │
├────────────────┬────────────────────────────────────────┤
│ 收集列表       │ 收集详情                                 │
│ ┌────────────┐ │ 收集: 用户登录功能需求                    │
│ │ 收集1 ●    │ │ ┌────────────────────────────────────┐  │
│ │ 收集2      │ │ │ 原始需求列表                       │  │
│ │ 收集3      │ │ │ ┌────────────────────────────────┐ │  │
│ └────────────┘ │ │ │ 用户需要通过邮箱登录系统       │ │  │
│                │ │ │ [AI转换] [编辑] [删除]        │ │  │
│ [+ 新建收集]   │ │ └────────────────────────────────┘ │  │
│                │ │ [+ 添加原始需求]                   │  │
│                │ └────────────────────────────────────┘  │
└────────────────┴────────────────────────────────────────┘
```

### 4.2 UserStoryManageView

**路由**: `/requirements/:requirementId/user-stories`

**功能**:
- 查看需求下的用户故事
- 创建/编辑用户故事
- 管理验收条件

**布局**:
```
┌─────────────────────────────────────────────────────────┐
│ 用户故事管理                                              │
├─────────────────────────────────────────────────────────┤
│ 需求: 用户登录功能                                        │
│ ┌─────────────────────────────────────────────────────┐  │
│ │ 用户故事 1                                          │  │
│ │ ┌─────────────────────────────────────────────────┐│  │
│ │ │ Role: 作为系统管理员                             ││  │
│ │ │ Goal: 我希望能够通过邮箱和密码登录系统           ││  │
│ │ │ Benefit: 以便我可以安全地访问系统功能           ││  │
│ │ └─────────────────────────────────────────────────┘│  │
│ │ 验收条件:                                          │  │
│ │ - [ ] 可使用邮箱登录                               │  │
│ │ - [ ] 密码错误提示"密码错误"                       │  │
│ │ [+ 添加验收条件]                                   │  │
│ │                              [编辑] [删除]        │  │
│ └─────────────────────────────────────────────────────┘  │
│                          [+ 新建用户故事]                 │
└─────────────────────────────────────────────────────────┘
```

### 4.3 AiConfigView 升级

**现有功能**: LLM 配置列表

**新增功能**:
- 创建 LLM 配置
- 编辑 LLM 配置
- 删除 LLM 配置
- 设置默认配置
- 测试连接

---

## 5. API 补充

### 5.1 user-stories API

```typescript
// src/api/userStories.ts
export { requirementsApi } // 复用 requirements.ts
```

### 5.2 llm API 补充

```typescript
// src/api/llm.ts (新建)
import type { CreateLLMConfigDto, UpdateLLMConfigDto } from '@req2task/dto'
import api from './axios'
import type { LLMConfigResponse } from './ai'

export const llmApi = {
  getConfigs: () => api.get<LLMConfigResponse[]>('/llm/config'),
  getConfig: (id: string) => api.get<LLMConfigResponse>(`/llm/config/${id}`),
  createConfig: (data: CreateLLMConfigDto) => api.post<LLMConfigResponse>('/llm/config', data),
  updateConfig: (id: string, data: UpdateLLMConfigDto) => api.put<LLMConfigResponse>(`/llm/config/${id}`, data),
  deleteConfig: (id: string) => api.delete(`/llm/config/${id}`),
  setDefault: (id: string) => api.post(`/llm/config/${id}/set-default`),
}
```

### 5.3 raw-requirements API 补充

```typescript
// src/api/rawRequirements.ts (新建)
import type { CreateRawRequirementDto } from '@req2task/dto'
import api from './axios'
import type { RawRequirementResponse } from './ai'

export const rawRequirementsApi = {
  getByModule: (moduleId: string) => api.get<RawRequirementResponse[]>(`/modules/${moduleId}/raw-requirements`),
  create: (moduleId: string, data: CreateRawRequirementDto) => 
    api.post<RawRequirementResponse>(`/modules/${moduleId}/raw-requirements`, data),
  generate: (id: string, configId?: string) => 
    api.post(`/raw-requirements/${id}/generate`, { configId }),
}
```

---

## 6. 验收标准

- [ ] 4 个新 Store 单元测试通过
- [ ] RawRequirementCollectView 完整功能可用
- [ ] UserStoryManageView 完整功能可用
- [ ] AiConfigView 支持完整 CRUD
- [ ] API 对接测试通过
- [ ] 代码 lint 检查通过

---

## 7. 依赖关系

```
后端 API (Sprint 13)
    │
    ▼
Store ◄── API
    │
    ├──► RawRequirementCollectView
    ├──► UserStoryManageView
    └──► AiConfigView (升级)
```

---

## 8. 风险

| 风险 | 影响 | 应对措施 |
|------|------|----------|
| 后端 API 延迟 | 无法对接 | 先用 Mock 数据 |
| Store 设计变更 | 返工 | 与后端提前对齐 |

---

**上一步**: [前端路线图](frontend-roadmap.md)
**下一步**: [Sprint 12: 组件体系](sprint-12-frontend-components.md)
