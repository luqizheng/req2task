# Copilot Instructions

## Design Context

### Users
**Primary**: 产品经理、需求分析师
**Secondary**: 开发工程师、测试工程师、技术负责人、项目经理

**Context**: 白天办公环境使用，专业软件工具
**Jobs to be done**:
- 撰写和管理需求文档
- AI辅助生成清晰的标准化需求
- 项目进度跟踪和可视化
- 需求变更管理和影响评估

### Brand Personality
- **Voice**: 清晰、专业、严谨
- **Tone**: 可靠、高效、不浮夸
- **3-word personality**: 清晰 · 严谨 · 可信
- **Emotional goals**: 用户感到掌控感和信任感，降低焦虑

### Aesthetic Direction
- **Visual tone**: Linear / Notion 风格 — 简洁、极简、高端
- **References**: Linear 的精致感、Notion 的清晰层次
- **Anti-references**: Jira 的笨重感、传统企业软件的繁琐
- **Theme**: 双主题支持（亮色为主，暗色补充）

### Design Principles

1. **信息优先** — 界面服务于信息展示，避免装饰性干扰
2. **层次分明** — 通过留白、字号、颜色区分信息优先级
3. **精准克制** — 动画和视觉效果服务于功能，不过度设计
4. **一致性** — 所有模块遵循统一的设计语言和交互模式
5. **可信赖感** — 重要操作有确认，数据变更有追溯

## Color Palette

| Token | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| Primary | #2563eb | #3b82f6 | 主要操作、链接 |
| Success | #10b981 | #34d399 | 成功状态、完成 |
| Warning | #f59e0b | #fbbf24 | 警告、待处理 |
| Danger | #ef4444 | #f87171 | 错误、风险 |
| AI Accent | #6366f1 | #818cf8 | AI功能标识 |

## Typography

- **Primary**: Inter（英文）/ Source Han Sans CN（中文）
- **Monospace**: JetBrains Mono
- **Scale**: 基于 4px 网格
- **Body**: 14-15px，Line-height 1.5-1.6

## Spatial System

- **Spacing unit**: 4px
- **Card padding**: 16-24px
- **Section gap**: 16-24px
- **Border radius**: 8px（组件）、12px（卡片）

## Motion Philosophy

- **原则**: 微动效增强反馈，不喧宾夺主
- **Duration**: 150-300ms
- **Easing**: ease-out 为主
- **场景**: 按钮悬停、模态展开、列表加载
- **禁用**: 大面积位移动画、过度闪烁

## Component Patterns

- **Cards**: 白色背景、细边框或柔和阴影、圆角 12px
- **Buttons**: 实心主按钮、描边次按钮、圆角 8px
- **Tables**: 斑马纹可选、行悬停高亮
- **Forms**: 垂直布局、标签左对齐、错误状态红色提示
