# QuestionAndAnswer 重构计划

## 目标
将 `RawRequirement.followUpQuestions` 从 `string[]` 改为 `QuestionAndAnswer[]`，包含 question/answer 字段。只有当所有 QuestionAndAnswer 都被回答（answer 有值）或被删除，才能生成 Requirement。

## QuestionAndAnswer 结构
```typescript
interface QuestionAndAnswer {
  id: string;           // 唯一标识
  question: string;     // AI 提出的追问
  answer: string | null; // 用户回答（null 表示未回答）
  createdAt: string;    // 创建时间
  answeredAt?: string;  // 回答时间
}
```

## 实施步骤

### 1. DTO 层定义

**文件**: `packages/dto/src/conversation/dto.ts`
- 修改 `FollowUpQuestionDto` → `QuestionAndAnswerDto`
  - 添加 `id: string`
  - 添加 `answer: string | null`
  - 添加 `createdAt: string`
  - 添加 `answeredAt?: string`
- 保留向后兼容可选字段

### 2. Entity 层修改

**文件**: `packages/core/src/entities/raw-requirement.entity.ts`
- 将 `followUpQuestions!: string[] | null` 改为 `questionAndAnswers!: QuestionAndAnswer[] | null`
- 类型直接内联，不引用 DTO

### 3. DTO 响应层修改

**文件**: `packages/dto/src/raw-requirement-collection/dto/raw-requirement-collection.dto.ts`
- `RawRequirementInCollectionDto`: `followUpQuestions` → `questionAndAnswers: QuestionAndAnswerDto[]`
- `RawRequirementResponseDto`: 同上
- `RequirementAnalysisResult`: 同上

**文件**: `packages/dto/src/ai/dto/requirement-generation.dto.ts`
- `AnalyzeWithFollowUpResultDto`: 更新字段
- `ChatCollectResultDto`: 更新字段

### 4. Service 层修改

**文件**: `apps/service/src/ai/requirement-generation.service.ts`
- `analyzeWithFollowUp()`: 返回 `QuestionAndAnswer[]` 而不是 `string[]`
- `chatCollect()`: 更新返回结构
- `streamChatCollect()`: 更新返回结构
- 新增 `answerQuestion()` 方法：回答指定追问
- 新增 `removeQuestion()` 方法：删除指定追问
- 新增 `checkAllQuestionsAnswered()` 逻辑

**文件**: `apps/service/src/raw-requirement-collection/raw-requirement-collection.service.ts`
- `updateRawRequirement()`: 更新 `questionAndAnswers` 字段
- 所有引用 `followUpQuestions` 的地方改为 `questionAndAnswers`

### 5. Controller 层修改

**文件**: `apps/service/src/ai/controllers/requirement-generation.controller.ts`
- 新增 `POST /raw-requirements/:id/answer` - 回答追问
- 新增 `DELETE /raw-requirements/:id/questions/:questionId` - 删除追问
- 修改现有端点返回结构

### 6. 生成 Requirement 条件检查

在 `generateRequirement()` 中新增检查：
```typescript
const unansweredQuestions = (rawRequirement.questionAndAnswers || [])
  .filter(qa => !qa.answer);

if (unansweredQuestions.length > 0) {
  throw new BadRequestException(
    `还有 ${unansweredQuestions.length} 个追问未回答，请先完成所有追问`
  );
}
```

### 7. 数据库迁移
- 字段名变更：`follow_up_questions` → `question_and_answers`
- 数据迁移脚本

## 改动文件清单

| 文件 | 改动类型 |
|------|----------|
| `packages/dto/src/conversation/dto.ts` | 修改 |
| `packages/core/src/entities/raw-requirement.entity.ts` | 修改 |
| `packages/dto/src/raw-requirement-collection/dto/raw-requirement-collection.dto.ts` | 修改 |
| `packages/dto/src/ai/dto/requirement-generation.dto.ts` | 修改 |
| `apps/service/src/ai/requirement-generation.service.ts` | 修改 |
| `apps/service/src/ai/controllers/requirement-generation.controller.ts` | 修改 |
| `apps/service/src/raw-requirement-collection/raw-requirement-collection.service.ts` | 修改 |

## API 变更

### 新增接口

```http
POST /raw-requirements/:id/questions/:questionId/answer
Content-Type: application/json

{
  "answer": "用户的回答"
}
```

```http
DELETE /raw-requirements/:id/questions/:questionId
```

### 响应变更

```json
{
  "questionAndAnswers": [
    {
      "id": "uuid",
      "question": "追问内容",
      "answer": "用户回答",  // null 表示未回答
      "createdAt": "2026-04-19T10:00:00Z",
      "answeredAt": "2026-04-19T10:05:00Z"
    }
  ]
}
```
