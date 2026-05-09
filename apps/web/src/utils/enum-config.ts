import type {
  ProjectStatus,
  RequirementStatus,
  RawRequirementStatus,
  TaskStatus,
  Priority,
  TaskPriority,
  CriteriaType,
  CollectionType,
  SystemType,
  LLMProviderType,
  AttachmentTargetType,
  ArchitectureType,
  ConversationStatus,
  CloudProvider,
  DatabaseType,
  MessageRole,
  ChangeType,
  SecurityLevel,
  ProjectScale,
  RequirementSource,
  ConflictType,
  UserRole,
  Permission,
  NotificationType,
} from '@req2task/dto'
import {
  ProjectStatus as PS,
  RequirementStatus as RS,
  RawRequirementStatus as RRS,
  TaskStatus as TS,
  Priority as P,
  TaskPriority as TP,
  CriteriaType as CT,
  CollectionType as CLT,
  SystemType as ST,
  LLMProviderType as LPT,
  AttachmentTargetType as ATT,
  ArchitectureType as AT,
  ConversationStatus as CS,
  CloudProvider as CP,
  DatabaseType as DT,
  MessageRole as MR,
  ChangeType as CGT,
  SecurityLevel as SL,
  ProjectScale as PSC,
  RequirementSource as RS2,
  ConflictType as CFT,
  UserRole as UR,
  Permission as PERM,
  NotificationType as NT,
} from '@req2task/dto'

// ── types ──────────────────────────────────────────────────────────

export interface EnumDisplayConfig {
  /** Display label in Chinese */
  label: string
  /** Tailwind CSS class for Badge background/text/border */
  cssClass?: string
  /** CSS variable name (e.g. "status-draft") */
  colorVar?: string
  /** Small dot indicator class */
  dotClass?: string
  /** shadcn Badge variant */
  variant?: 'default' | 'secondary' | 'destructive' | 'outline'
}

export type EnumConfigMap<T extends string> = Record<T, EnumDisplayConfig>

// ── helpers ────────────────────────────────────────────────────────

export function getEnumLabel<T extends string>(
  map: EnumConfigMap<T>,
  value: T,
): string {
  return map[value]?.label ?? value
}

export function getEnumClass<T extends string>(
  map: EnumConfigMap<T>,
  value: T,
): string {
  return map[value]?.cssClass ?? ''
}

export function getEnumDot<T extends string>(
  map: EnumConfigMap<T>,
  value: T,
): string {
  return map[value]?.dotClass ?? ''
}

export function getEnumColorVar<T extends string>(
  map: EnumConfigMap<T>,
  value: T,
): string {
  return map[value]?.colorVar ?? ''
}

export function getEnumVariant<T extends string>(
  map: EnumConfigMap<T>,
  value: T,
): 'default' | 'secondary' | 'destructive' | 'outline' {
  return map[value]?.variant ?? 'outline'
}

/** Build a flat { value, label } array for Select options */
export function toSelectOptions<T extends string>(map: EnumConfigMap<T>) {
  return (Object.keys(map) as T[]).map((key) => ({
    value: key,
    label: map[key].label,
  }))
}

// ── ProjectStatus ──────────────────────────────────────────────────

export const PROJECT_STATUS_CONFIG: EnumConfigMap<ProjectStatus> = {
  [PS.PLANNING]: {
    label: '规划中',
    cssClass: 'bg-blue-100 text-blue-700 border-blue-200',
    dotClass: 'bg-blue-500',
  },
  [PS.ACTIVE]: {
    label: '进行中',
    cssClass: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    dotClass: 'bg-emerald-500',
  },
  [PS.ON_HOLD]: {
    label: '暂停',
    cssClass: 'bg-amber-100 text-amber-700 border-amber-200',
    dotClass: 'bg-amber-500',
  },
  [PS.COMPLETED]: {
    label: '已完成',
    cssClass: 'bg-purple-100 text-purple-700 border-purple-200',
    dotClass: 'bg-purple-500',
  },
  [PS.ARCHIVED]: {
    label: '已归档',
    cssClass: 'bg-slate-100 text-slate-600 border-slate-200',
    dotClass: 'bg-slate-400',
  },
}

// ── RequirementStatus ──────────────────────────────────────────────

export const REQUIREMENT_STATUS_CONFIG: EnumConfigMap<RequirementStatus> = {
  [RS.DRAFT]: {
    label: '草稿',
    cssClass: 'bg-slate-100 text-slate-700',
    colorVar: 'status-draft',
    variant: 'outline',
  },
  [RS.REVIEWED]: {
    label: '已审核',
    cssClass: 'bg-blue-100 text-blue-700',
    colorVar: 'status-reviewed',
    variant: 'secondary',
  },
  [RS.APPROVED]: {
    label: '已批准',
    cssClass: 'bg-emerald-100 text-emerald-700',
    colorVar: 'status-approved',
    variant: 'default',
  },
  [RS.REJECTED]: {
    label: '已拒绝',
    cssClass: 'bg-red-100 text-red-700',
    colorVar: 'status-rejected',
    variant: 'destructive',
  },
  [RS.PROCESSING]: {
    label: '进行中',
    cssClass: 'bg-indigo-100 text-indigo-700',
    colorVar: 'status-processing',
    variant: 'secondary',
  },
  [RS.COMPLETED]: {
    label: '已完成',
    cssClass: 'bg-purple-100 text-purple-700',
    colorVar: 'status-completed',
    variant: 'default',
  },
  [RS.CANCELLED]: {
    label: '已取消',
    cssClass: 'bg-slate-100 text-slate-600',
    colorVar: 'status-cancelled',
    variant: 'outline',
  },
}

// ── RawRequirementStatus ───────────────────────────────────────────

export const RAW_REQUIREMENT_STATUS_CONFIG: EnumConfigMap<RawRequirementStatus> = {
  [RRS.PENDING]: {
    label: '待处理',
    cssClass: 'bg-slate-100 text-slate-700',
  },
  [RRS.PROCESSING]: {
    label: '处理中',
    cssClass: 'bg-blue-100 text-blue-700',
  },
  [RRS.COMPLETED]: {
    label: '已完成',
    cssClass: 'bg-emerald-100 text-emerald-700',
  },
  [RRS.CLARIFIED]: {
    label: '已澄清',
    cssClass: 'bg-indigo-100 text-indigo-700',
  },
  [RRS.CONVERTED]: {
    label: '已转换',
    cssClass: 'bg-purple-100 text-purple-700',
  },
  [RRS.DISCARDED]: {
    label: '已废弃',
    cssClass: 'bg-red-100 text-red-700',
  },
  [RRS.FAILED]: {
    label: '失败',
    cssClass: 'bg-red-100 text-red-700',
  },
}

// ── TaskStatus ─────────────────────────────────────────────────────

export const TASK_STATUS_CONFIG: EnumConfigMap<TaskStatus> = {
  [TS.TODO]: {
    label: '待办',
    cssClass: 'bg-status-draft/10 text-status-draft',
    colorVar: 'status-draft',
  },
  [TS.IN_PROGRESS]: {
    label: '进行中',
    cssClass: 'bg-status-processing/10 text-status-processing',
    colorVar: 'status-processing',
  },
  [TS.IN_REVIEW]: {
    label: '审核中',
    cssClass: 'bg-status-reviewed/10 text-status-reviewed',
    colorVar: 'status-reviewed',
  },
  [TS.DONE]: {
    label: '已完成',
    cssClass: 'bg-status-completed/10 text-status-completed',
    colorVar: 'status-completed',
  },
  [TS.BLOCKED]: {
    label: '已阻塞',
    cssClass: 'bg-status-rejected/10 text-status-rejected',
    colorVar: 'status-rejected',
  },
  [TS.CANCELLED]: {
    label: '已取消',
    cssClass: 'bg-status-cancelled/10 text-status-cancelled',
    colorVar: 'status-cancelled',
  },
}

// ── Priority (Requirement) ─────────────────────────────────────────

export const PRIORITY_CONFIG: EnumConfigMap<Priority> = {
  [P.CRITICAL]: {
    label: '关键',
    cssClass: 'bg-red-500 text-white',
    colorVar: 'priority-critical',
    variant: 'destructive',
  },
  [P.HIGH]: {
    label: '高',
    cssClass: 'bg-orange-500 text-white',
    colorVar: 'priority-high',
    variant: 'default',
  },
  [P.MEDIUM]: {
    label: '中',
    cssClass: 'bg-yellow-500 text-white',
    colorVar: 'priority-medium',
    variant: 'secondary',
  },
  [P.LOW]: {
    label: '低',
    cssClass: 'bg-slate-500 text-white',
    colorVar: 'priority-low',
    variant: 'outline',
  },
}

// ── TaskPriority ───────────────────────────────────────────────────

export const TASK_PRIORITY_CONFIG: EnumConfigMap<TaskPriority> = {
  [TP.URGENT]: {
    label: '紧急',
    cssClass: 'bg-priority-critical text-white',
    colorVar: 'priority-critical',
    variant: 'destructive',
  },
  [TP.HIGH]: {
    label: '高',
    cssClass: 'bg-priority-high text-white',
    colorVar: 'priority-high',
    variant: 'default',
  },
  [TP.MEDIUM]: {
    label: '中',
    cssClass: 'bg-priority-medium text-white',
    colorVar: 'priority-medium',
    variant: 'secondary',
  },
  [TP.LOW]: {
    label: '低',
    cssClass: 'bg-priority-low text-white',
    colorVar: 'priority-low',
    variant: 'outline',
  },
}

export const CRITERIA_TYPE_CONFIG: EnumConfigMap<CriteriaType> = {
  [CT.FUNCTIONAL]: {
    label: '功能性',
    cssClass: 'bg-blue-100 text-blue-700',
  },
  [CT.NON_FUNCTIONAL]: {
    label: '非功能性',
    cssClass: 'bg-purple-100 text-purple-700',
  },
  [CT.PERFORMANCE]: {
    label: '性能',
    cssClass: 'bg-green-100 text-green-700',
  },
  [CT.SECURITY]: {
    label: '安全',
    cssClass: 'bg-orange-100 text-orange-700',
  },
  [CT.USABILITY]: {
    label: '易用性',
    cssClass: 'bg-cyan-100 text-cyan-700',
  },
}

export const COLLECTION_TYPE_CONFIG: EnumConfigMap<CollectionType> = {
  [CLT.MEETING]: {
    label: '会议',
    cssClass: 'bg-purple-100 text-purple-700',
  },
  [CLT.INTERVIEW]: {
    label: '访谈',
    cssClass: 'bg-blue-100 text-blue-700',
  },
  [CLT.DOCUMENT]: {
    label: '文档',
    cssClass: 'bg-green-100 text-green-700',
  },
  [CLT.OTHER]: {
    label: '其他',
    cssClass: 'bg-slate-100 text-slate-600',
  },
}

export const SYSTEM_TYPE_CONFIG: EnumConfigMap<SystemType> = {
  [ST.ECOMMERCE]: { label: '电商', cssClass: 'bg-pink-100 text-pink-700' },
  [ST.CMS]: { label: 'CMS', cssClass: 'bg-blue-100 text-blue-700' },
  [ST.ERP]: { label: 'ERP', cssClass: 'bg-indigo-100 text-indigo-700' },
  [ST.CRM]: { label: 'CRM', cssClass: 'bg-violet-100 text-violet-700' },
  [ST.OA]: { label: 'OA', cssClass: 'bg-teal-100 text-teal-700' },
  [ST.LMS]: { label: 'LMS', cssClass: 'bg-green-100 text-green-700' },
  [ST.MES]: { label: 'MES', cssClass: 'bg-amber-100 text-amber-700' },
  [ST.SCM]: { label: 'SCM', cssClass: 'bg-orange-100 text-orange-700' },
  [ST.HEALTHCARE]: { label: '医疗', cssClass: 'bg-red-100 text-red-700' },
  [ST.FINTECH]: { label: '金融', cssClass: 'bg-emerald-100 text-emerald-700' },
  [ST.IOT]: { label: 'IoT', cssClass: 'bg-cyan-100 text-cyan-700' },
  [ST.GAMING]: { label: '游戏', cssClass: 'bg-fuchsia-100 text-fuchsia-700' },
  [ST.SOCIAL]: { label: '社交', cssClass: 'bg-rose-100 text-rose-700' },
  [ST.EDUCATION]: { label: '教育', cssClass: 'bg-yellow-100 text-yellow-700' },
  [ST.CUSTOM]: { label: '自定义', cssClass: 'bg-slate-100 text-slate-600' },
}

export const LLM_PROVIDER_TYPE_CONFIG: EnumConfigMap<LLMProviderType> = {
  [LPT.DEEPSEEK]: { label: 'DeepSeek', cssClass: 'bg-emerald-100 text-emerald-700' },
  [LPT.OPENAI]: { label: 'OpenAI', cssClass: 'bg-green-100 text-green-700' },
  [LPT.OLLAMA]: { label: 'Ollama', cssClass: 'bg-orange-100 text-orange-700' },
}

export const ATTACHMENT_TARGET_TYPE_CONFIG: EnumConfigMap<AttachmentTargetType> = {
  [ATT.REQUIREMENT]: { label: '需求', cssClass: 'bg-blue-100 text-blue-700' },
  [ATT.TASK]: { label: '任务', cssClass: 'bg-green-100 text-green-700' },
  [ATT.USER_STORY]: { label: '用户故事', cssClass: 'bg-purple-100 text-purple-700' },
  [ATT.PROJECT]: { label: '项目', cssClass: 'bg-orange-100 text-orange-700' },
  [ATT.CONVERSATION]: { label: '对话', cssClass: 'bg-slate-100 text-slate-600' },
}

export const ARCHITECTURE_TYPE_CONFIG: EnumConfigMap<ArchitectureType> = {
  [AT.MONOLITHIC]: { label: '单体', cssClass: 'bg-slate-100 text-slate-700' },
  [AT.MICROSERVICE]: { label: '微服务', cssClass: 'bg-blue-100 text-blue-700' },
  [AT.SERVERLESS]: { label: '无服务器', cssClass: 'bg-green-100 text-green-700' },
  [AT.MICROSERVICE_MONO_REPO]: { label: '微服务单体仓', cssClass: 'bg-indigo-100 text-indigo-700' },
  [AT.MODULAR_MONOLITH]: { label: '模块化单体', cssClass: 'bg-purple-100 text-purple-700' },
  [AT.EVENT_DRIVEN]: { label: '事件驱动', cssClass: 'bg-orange-100 text-orange-700' },
  [AT.LAYERED]: { label: '分层架构', cssClass: 'bg-cyan-100 text-cyan-700' },
  [AT.HEXAGONAL]: { label: '六边形', cssClass: 'bg-pink-100 text-pink-700' },
  [AT.DDD]: { label: 'DDD', cssClass: 'bg-red-100 text-red-700' },
}

export const CONVERSATION_STATUS_CONFIG: EnumConfigMap<ConversationStatus> = {
  [CS.ACTIVE]: { label: '进行中', cssClass: 'bg-blue-100 text-blue-700' },
  [CS.COMPLETED]: { label: '已完成', cssClass: 'bg-green-100 text-green-700' },
  [CS.ARCHIVED]: { label: '已归档', cssClass: 'bg-slate-100 text-slate-600' },
}

export const CLOUD_PROVIDER_CONFIG: EnumConfigMap<CloudProvider> = {
  [CP.ALIYUN]: { label: '阿里云', cssClass: 'bg-orange-100 text-orange-700' },
  [CP.TENCENT]: { label: '腾讯云', cssClass: 'bg-red-100 text-red-700' },
  [CP.HUAWEI]: { label: '华为云', cssClass: 'bg-yellow-100 text-yellow-700' },
  [CP.AWS]: { label: 'AWS', cssClass: 'bg-orange-200 text-orange-800' },
  [CP.GCP]: { label: 'GCP', cssClass: 'bg-blue-100 text-blue-700' },
  [CP.AZURE]: { label: 'Azure', cssClass: 'bg-blue-200 text-blue-800' },
  [CP.SELF_HOSTED]: { label: '自托管', cssClass: 'bg-slate-100 text-slate-600' },
}

export const DATABASE_TYPE_CONFIG: EnumConfigMap<DatabaseType> = {
  [DT.POSTGRESQL]: { label: 'PostgreSQL', cssClass: 'bg-blue-100 text-blue-700' },
  [DT.MYSQL]: { label: 'MySQL', cssClass: 'bg-orange-100 text-orange-700' },
  [DT.MONGODB]: { label: 'MongoDB', cssClass: 'bg-green-100 text-green-700' },
  [DT.REDIS]: { label: 'Redis', cssClass: 'bg-red-100 text-red-700' },
  [DT.ELASTICSEARCH]: { label: 'Elasticsearch', cssClass: 'bg-yellow-100 text-yellow-700' },
  [DT.MARIADB]: { label: 'MariaDB', cssClass: 'bg-purple-100 text-purple-700' },
  [DT.ORACLE]: { label: 'Oracle', cssClass: 'bg-red-200 text-red-800' },
  [DT.SQLSERVER]: { label: 'SQL Server', cssClass: 'bg-blue-200 text-blue-800' },
  [DT.SQLITE]: { label: 'SQLite', cssClass: 'bg-slate-100 text-slate-600' },
  [DT.DYNAMODB]: { label: 'DynamoDB', cssClass: 'bg-yellow-200 text-yellow-800' },
  [DT.COUCHDB]: { label: 'CouchDB', cssClass: 'bg-teal-100 text-teal-700' },
  [DT.NEO4J]: { label: 'Neo4j', cssClass: 'bg-purple-200 text-purple-800' },
  [DT.TIMESERIES]: { label: '时序数据库', cssClass: 'bg-cyan-100 text-cyan-700' },
}

export const MESSAGE_ROLE_CONFIG: EnumConfigMap<MessageRole> = {
  [MR.USER]: { label: '用户', cssClass: 'bg-blue-100 text-blue-700' },
  [MR.ASSISTANT]: { label: '助手', cssClass: 'bg-green-100 text-green-700' },
  [MR.SYSTEM]: { label: '系统', cssClass: 'bg-slate-100 text-slate-600' },
}

export const CHANGE_TYPE_CONFIG: EnumConfigMap<ChangeType> = {
  [CGT.STATUS_CHANGE]: { label: '状态变更', cssClass: 'bg-blue-100 text-blue-700' },
  [CGT.CONTENT_CHANGE]: { label: '内容变更', cssClass: 'bg-purple-100 text-purple-700' },
  [CGT.PRIORITY_CHANGE]: { label: '优先级变更', cssClass: 'bg-orange-100 text-orange-700' },
  [CGT.ASSIGNEE_CHANGE]: { label: '负责人变更', cssClass: 'bg-cyan-100 text-cyan-700' },
  [CGT.REVIEW_RESULT]: { label: '评审结果', cssClass: 'bg-yellow-100 text-yellow-700' },
}

export const SECURITY_LEVEL_CONFIG: EnumConfigMap<SecurityLevel> = {
  [SL.BASIC]: { label: '基础', cssClass: 'bg-slate-100 text-slate-700' },
  [SL.STANDARD]: { label: '标准', cssClass: 'bg-blue-100 text-blue-700' },
  [SL.ENHANCED]: { label: '增强', cssClass: 'bg-orange-100 text-orange-700' },
  [SL.HIGH]: { label: '高级', cssClass: 'bg-red-100 text-red-700' },
}

export const PROJECT_SCALE_CONFIG: EnumConfigMap<ProjectScale> = {
  [PSC.SMALL]: { label: '小型', cssClass: 'bg-green-100 text-green-700' },
  [PSC.MEDIUM]: { label: '中型', cssClass: 'bg-blue-100 text-blue-700' },
  [PSC.LARGE]: { label: '大型', cssClass: 'bg-purple-100 text-purple-700' },
  [PSC.ENTERPRISE]: { label: '企业级', cssClass: 'bg-red-100 text-red-700' },
}

export const REQUIREMENT_SOURCE_CONFIG: EnumConfigMap<RequirementSource> = {
  [RS2.MANUAL]: { label: '手动录入', cssClass: 'bg-blue-100 text-blue-700' },
  [RS2.AI_GENERATED]: { label: 'AI生成', cssClass: 'bg-purple-100 text-purple-700' },
  [RS2.DOCUMENT_IMPORT]: { label: '文档导入', cssClass: 'bg-green-100 text-green-700' },
}

export const CONFLICT_TYPE_CONFIG: EnumConfigMap<ConflictType> = {
  [CFT.LOGICAL]: { label: '逻辑冲突', cssClass: 'bg-orange-100 text-orange-700' },
  [CFT.TEMPORAL]: { label: '时序冲突', cssClass: 'bg-blue-100 text-blue-700' },
  [CFT.FUNCTIONAL]: { label: '功能冲突', cssClass: 'bg-purple-100 text-purple-700' },
  [CFT.RESOURCE]: { label: '资源冲突', cssClass: 'bg-red-100 text-red-700' },
}

export const USER_ROLE_CONFIG: EnumConfigMap<UserRole> = {
  [UR.ADMIN]: { label: '管理员', cssClass: 'bg-red-100 text-red-700' },
  [UR.USER]: { label: '用户', cssClass: 'bg-blue-100 text-blue-700' },
  [UR.PROJECT_MANAGER]: { label: '项目经理', cssClass: 'bg-purple-100 text-purple-700' },
  [UR.REQUIREMENT_ANALYST]: { label: '需求分析师', cssClass: 'bg-green-100 text-green-700' },
  [UR.DEVELOPER]: { label: '开发', cssClass: 'bg-orange-100 text-orange-700' },
  [UR.TESTER]: { label: '测试', cssClass: 'bg-cyan-100 text-cyan-700' },
}

export const PERMISSION_CONFIG: EnumConfigMap<Permission> = {
  [PERM.PROJECT_VIEW]: { label: '查看项目', cssClass: 'bg-slate-100 text-slate-700' },
  [PERM.PROJECT_EDIT]: { label: '编辑项目', cssClass: 'bg-blue-100 text-blue-700' },
  [PERM.PROJECT_DELETE]: { label: '删除项目', cssClass: 'bg-red-100 text-red-700' },
  [PERM.PROJECT_MANAGE_MEMBERS]: { label: '管理成员', cssClass: 'bg-purple-100 text-purple-700' },
  [PERM.MODULE_VIEW]: { label: '查看模块', cssClass: 'bg-slate-100 text-slate-700' },
  [PERM.MODULE_CREATE]: { label: '创建模块', cssClass: 'bg-green-100 text-green-700' },
  [PERM.MODULE_EDIT]: { label: '编辑模块', cssClass: 'bg-blue-100 text-blue-700' },
  [PERM.MODULE_DELETE]: { label: '删除模块', cssClass: 'bg-red-100 text-red-700' },
  [PERM.REQUIREMENT_VIEW]: { label: '查看需求', cssClass: 'bg-slate-100 text-slate-700' },
  [PERM.REQUIREMENT_CREATE]: { label: '创建需求', cssClass: 'bg-green-100 text-green-700' },
  [PERM.REQUIREMENT_EDIT]: { label: '编辑需求', cssClass: 'bg-blue-100 text-blue-700' },
  [PERM.REQUIREMENT_DELETE]: { label: '删除需求', cssClass: 'bg-red-100 text-red-700' },
  [PERM.REQUIREMENT_REVIEW]: { label: '评审需求', cssClass: 'bg-purple-100 text-purple-700' },
  [PERM.TASK_VIEW]: { label: '查看任务', cssClass: 'bg-slate-100 text-slate-700' },
  [PERM.TASK_CREATE]: { label: '创建任务', cssClass: 'bg-green-100 text-green-700' },
  [PERM.TASK_EDIT]: { label: '编辑任务', cssClass: 'bg-blue-100 text-blue-700' },
  [PERM.TASK_DELETE]: { label: '删除任务', cssClass: 'bg-red-100 text-red-700' },
  [PERM.TASK_ASSIGN]: { label: '分配任务', cssClass: 'bg-orange-100 text-orange-700' },
  [PERM.BASELINE_CREATE]: { label: '创建基线', cssClass: 'bg-indigo-100 text-indigo-700' },
  [PERM.BASELINE_RESTORE]: { label: '恢复基线', cssClass: 'bg-cyan-100 text-cyan-700' },
  [PERM.AI_USE]: { label: '使用AI', cssClass: 'bg-fuchsia-100 text-fuchsia-700' },
  [PERM.ADMIN]: { label: '管理员', cssClass: 'bg-red-100 text-red-700' },
}

export const NOTIFICATION_TYPE_CONFIG: EnumConfigMap<NotificationType> = {
  [NT.TASK_ASSIGNED]: { label: '任务分配', cssClass: 'bg-blue-100 text-blue-700' },
  [NT.TASK_UPDATED]: { label: '任务更新', cssClass: 'bg-indigo-100 text-indigo-700' },
  [NT.TASK_COMPLETED]: { label: '任务完成', cssClass: 'bg-green-100 text-green-700' },
  [NT.REQUIREMENT_CREATED]: { label: '需求创建', cssClass: 'bg-purple-100 text-purple-700' },
  [NT.REQUIREMENT_REVIEW]: { label: '需求评审', cssClass: 'bg-yellow-100 text-yellow-700' },
  [NT.REQUIREMENT_APPROVED]: { label: '需求批准', cssClass: 'bg-emerald-100 text-emerald-700' },
  [NT.REQUIREMENT_REJECTED]: { label: '需求拒绝', cssClass: 'bg-red-100 text-red-700' },
  [NT.REQUIREMENT_CHANGED]: { label: '需求变更', cssClass: 'bg-orange-100 text-orange-700' },
  [NT.AI_GENERATION_COMPLETE]: { label: 'AI生成完成', cssClass: 'bg-fuchsia-100 text-fuchsia-700' },
  [NT.BASELINE_CREATED]: { label: '基线创建', cssClass: 'bg-cyan-100 text-cyan-700' },
  [NT.PROJECT_MEMBER_ADDED]: { label: '成员加入', cssClass: 'bg-teal-100 text-teal-700' },
}
