# Sprint 14: 权限与通知

**计划类型**: 前端开发
**目标**: 权限管理 UI 和通知系统
**预计时长**: 1 周 (约 4.5 人天)
**状态**: ⏳ 待开始
**里程碑**: M6

---

## 1. 目标

- 权限管理 UI
- 角色管理
- 通知面板
- WebSocket 实时通知

---

## 2. 任务列表

### 2.1 权限管理

| 任务 | 类型 | 预估 | 优先级 | 状态 |
|------|------|------|--------|------|
| PermissionStore | store | 4h | P1 | ⏳ |
| PermissionManageView | page | 8h | P1 | ⏳ |
| RoleManageView | page | 6h | P1 | ⏳ |
| 权限指令 (v-permission) | directive | 4h | P1 | ⏳ |

### 2.2 通知系统

| 任务 | 类型 | 预估 | 优先级 | 状态 |
|------|------|------|--------|------|
| NotificationStore | store | 4h | P2 | ⏳ |
| NotificationPanel | component | 6h | P2 | ⏳ |
| NotificationBell | component | 2h | P2 | ⏳ |
| WebSocket 连接 | feature | 6h | P2 | ⏳ |
| 通知设置 | feature | 4h | P3 | ⏳ |

**总预估工时**: 36h

---

## 3. 权限设计

### 3.1 权限模型

```typescript
// 权限枚举
enum Permission {
  // 项目权限
  PROJECT_VIEW = 'project:view',
  PROJECT_EDIT = 'project:edit',
  PROJECT_DELETE = 'project:delete',
  PROJECT_MANAGE_MEMBERS = 'project:manage_members',
  
  // 需求权限
  REQUIREMENT_CREATE = 'requirement:create',
  REQUIREMENT_EDIT = 'requirement:edit',
  REQUIREMENT_DELETE = 'requirement:delete',
  REQUIREMENT_REVIEW = 'requirement:review',
  
  // 任务权限
  TASK_CREATE = 'task:create',
  TASK_EDIT = 'task:edit',
  TASK_DELETE = 'task:delete',
  TASK_ASSIGN = 'task:assign',
  
  // AI 权限
  AI_USE = 'ai:use',
  AI_CONFIG = 'ai:config',
  
  // 管理权限
  USER_MANAGE = 'user:manage',
  SYSTEM_CONFIG = 'system:config'
}

// 角色
interface Role {
  id: string
  name: string
  description: string
  permissions: Permission[]
  isSystem: boolean // 系统角色不可删除
}

// 项目成员权限
interface MemberPermission {
  userId: string
  projectId: string
  roleId: string
  customPermissions?: Permission[] // 自定义权限
}
```

### 3.2 权限指令

```typescript
// src/directives/permission.ts
import type { Directive } from 'vue'
import { useUserStore } from '@/stores/user'

export const permission: Directive = {
  mounted(el, binding) {
    const userStore = useUserStore()
    const requiredPermission = binding.value
    
    if (!userStore.hasPermission(requiredPermission)) {
      el.style.display = 'none'
    }
  }
}

// 使用
<el-button v-permission="'requirement:create'">创建需求</el-button>
<el-button v-permission="['requirement:edit', 'requirement:delete']">
  编辑/删除
</el-button>
```

### 3.3 页面设计

**PermissionManageView**
```
┌─────────────────────────────────────────────────────────┐
│ 权限管理                                                 │
├─────────────────────────────────────────────────────────┤
│ 项目: [选择项目 ▼]                                       │
│                                                         │
│ ┌───────────────────────┐  ┌───────────────────────────┐│
│ │ 成员列表              │  │ 成员权限配置               ││
│ │ ┌─────────────────┐  │  │                           ││
│ │ │ 张三 (PM)       │  │  │ 成员: 张三                 ││
│ │ │ 李四 (Dev)  ●   │  │  │ 角色: 项目经理              ││
│ │ │ 王五 (Viewer)   │  │  │                           ││
│ │ └─────────────────┘  │  │ 权限:                      ││
│ │                      │  │ [✓] 项目查看               ││
│ │                      │  │ [✓] 项目编辑               ││
│ │                      │  │ [✓] 需求管理               ││
│ │                      │  │ [✓] 任务管理               ││
│ │                      │  │ [ ] 用户管理               ││
│ │                      │  │                           ││
│ │                      │  │            [保存]         ││
│ └───────────────────────┘  └───────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

**RoleManageView**
```
┌─────────────────────────────────────────────────────────┐
│ 角色管理                                                 │
├─────────────────────────────────────────────────────────┤
│ [+ 创建角色]                                              │
│ ┌─────────────────────────────────────────────────────┐  │
│ │ 管理员 (系统角色)                                     │  │
│ │ 拥有所有权限                           [查看] [编辑] │  │
│ ├─────────────────────────────────────────────────────┤  │
│ │ 项目经理                                              │  │
│ │ 项目管理、需求管理、任务管理              [查看] [编辑] │  │
│ ├─────────────────────────────────────────────────────┤  │
│ │ 开发者                                                │  │
│ │ 查看项目、编辑任务                         [查看] [编辑] │  │
│ └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 4. 通知设计

### 4.1 通知模型

```typescript
interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  data: {
    projectId?: string
    requirementId?: string
    taskId?: string
    url?: string
  }
  read: boolean
  createdAt: string
}

enum NotificationType {
  TASK_ASSIGNED = 'task_assigned',
  TASK_UPDATED = 'task_updated',
  REQUIREMENT_REVIEW = 'requirement_review',
  REQUIREMENT_APPROVED = 'requirement_approved',
  REQUIREMENT_REJECTED = 'requirement_rejected',
  AI_GENERATION_COMPLETE = 'ai_generation_complete',
  BASELINE_CREATED = 'baseline_created',
  MEMBER_INVITED = 'member_invited'
}
```

### 4.2 WebSocket 连接

```typescript
// src/composables/useWebSocket.ts
import { ref, onMounted, onUnmounted } from 'vue'
import { useNotificationStore } from '@/stores/notification'

export function useWebSocket() {
  const notificationStore = useNotificationStore()
  const ws = ref<WebSocket | null>(null)
  
  const connect = () => {
    const token = localStorage.getItem('token')
    ws.value = new WebSocket(`${WS_URL}?token=${token}`)
    
    ws.value.onmessage = (event) => {
      const notification = JSON.parse(event.data)
      notificationStore.add(notification)
    }
    
    ws.value.onclose = () => {
      // 自动重连
      setTimeout(connect, 3000)
    }
  }
  
  const disconnect = () => {
    ws.value?.close()
  }
  
  onMounted(connect)
  onUnmounted(disconnect)
  
  return { ws }
}
```

### 4.3 通知面板

```
┌─────────────────────────────────────────────────────────┐
│ 通知                                    [全部标为已读]   │
├─────────────────────────────────────────────────────────┤
│ [全部] [未读] [已读]                                      │
│ ┌─────────────────────────────────────────────────────┐  │
│ │ 🔔 任务分配                                          │  │
│ │ 张三将「用户登录功能开发」分配给你                    │  │
│ │ 5分钟前                        [查看]                │  │
│ ├─────────────────────────────────────────────────────┤  │
│ │ 🔔 需求审批                                          │  │
│ │ 新需求「支付功能」待审核                              │  │
│ │ 30分钟前                       [查看]                │  │
│ ├─────────────────────────────────────────────────────┤  │
│ │ ✓ 需求通过                                          │  │
│ │ 需求「用户注册」已通过审批                            │  │
│ │ 1小时前                         [查看]               │  │
│ └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 5. 验收标准

- [ ] 权限管理 UI 可用
- [ ] 角色管理可配置
- [ ] 通知实时推送
- [ ] 通知面板功能完整
- [ ] v-permission 指令正常工作

---

**上一步**: [Sprint 13: 体验优化](sprint-13-frontend-experience.md)
**下一步**: [M6 里程碑验收](../README.md)
