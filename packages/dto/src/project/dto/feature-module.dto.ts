import { IsString, IsOptional, IsInt, Min, IsArray } from 'class-validator';

export class CreateFeatureModuleDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  moduleKey!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  aliases?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keywords?: string[];

  @IsOptional()
  @IsInt()
  @Min(0)
  sort?: number;

  @IsOptional()
  @IsString()
  parentId?: string;

  @IsString()
  projectId!: string;
}

export class UpdateFeatureModuleDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  aliases?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keywords?: string[];

  @IsOptional()
  @IsInt()
  @Min(0)
  sort?: number;

  @IsOptional()
  @IsString()
  parentId?: string;
}

export class FeatureModuleResponseDto {
  id!: string;
  name!: string;
  description!: string | null;
  moduleKey!: string;
  aliases!: string[] | null;
  keywords!: string[] | null;
  path!: string | null;
  sort!: number;
  parentId!: string | null;
  projectId!: string;
  children!: FeatureModuleResponseDto[];
  createdAt!: Date;
  updatedAt!: Date;
}

export class FeatureModuleListResponseDto {
  items!: FeatureModuleResponseDto[];
  total!: number;
  page!: number;
  limit!: number;
}
