# DTO规范

## 3.1 DTO文件结构

```typescript
// apps/backend/src/modules/dto/index.ts

//强调：所有DTO都必须用 shared-types 中定义的类型
import type {
  ICreateProjectData,
  IUpdateProjectData,
  IProjectResponse,
} from "@ai-sowf/shared-types";
import { IsString, IsOptional } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateProjectDto implements ICreateProjectData {
  @ApiProperty({ description: "项目名称" })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: "项目描述" })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateProjectDto implements IUpdateProjectData {
  @ApiPropertyOptional({ description: "项目名称" })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: "项目描述" })
  @IsOptional()
  @IsString()
  description?: string;
}

export class QueryProjectDto {
  @ApiPropertyOptional({ description: "页码" })
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ description: "每页数量" })
  @IsOptional()
  pageSize?: number = 10;

  @ApiPropertyOptional({ description: "搜索关键词" })
  @IsOptional()
  keyword?: string;
}
```

## 3.3 DTO 设计原则

```typescript
// ✅ 正确：使用 implements ICreateProjectData 继承 @req2task/dto 项目类型
export class CreateProjectDto implements ICreateProjectData {
  // 必须字段在前，可选字段在后
  @ApiProperty({ description: '项目名称' })
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  description?: string;
}

// ✅ 正确：返回时手动映射，避免暴露 ORM 结构
async create(@Body() dto: CreateProjectDto, userId: string) {
  const project = await this.projectService.create(dto, userId);
  return {
    id: project.id,
    name: project.name,
    code: project.code,
    createdAt: project.createdAt,
  } as IProjectResponse; //正确类型来源于shared-type。
}

// ❌ 错误：直接返回实体
async create(@Body() dto: CreateProjectDto) {
  return this.projectService.create(dto); // 返回了 ORM 实体
}
```
