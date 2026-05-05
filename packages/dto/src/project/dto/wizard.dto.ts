import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsNumber,
  IsArray,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  SystemType,
  ArchitectureType,
  DatabaseType,
  CloudProvider,
  SecurityLevel,
  ProjectScale,
} from '../../enums';

export class WizardStepDto {
  id!: string;
  title!: string;
  description!: string;
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WizardFieldDto)
  fields!: WizardFieldDto[];
  aiSuggestion?: boolean;
}

export class WizardFieldDto {
  @IsString()
  key!: string;

  @IsString()
  type!: 'select' | 'multiselect' | 'text' | 'number' | 'boolean' | 'json';

  @IsString()
  label!: string;

  @IsOptional()
  @IsString()
  placeholder?: string;

  required!: boolean;

  @IsOptional()
  @IsArray()
  options?: { value: string; label: string }[];

  @IsOptional()
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };

  @IsOptional()
  @IsBoolean()
  aiGenerated?: boolean;

  @IsOptional()
  @IsBoolean()
  aiSuggestion?: boolean;
}

export class TechStackDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => FrontendStackDto)
  frontend?: FrontendStackDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => BackendStackDto)
  backend?: BackendStackDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => InfrastructureStackDto)
  infrastructure?: InfrastructureStackDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => DevOpsStackDto)
  devops?: DevOpsStackDto;
}

export class FrontendStackDto {
  @IsOptional()
  @IsString()
  framework?: string;

  @IsOptional()
  @IsString()
  uiLibrary?: string;

  @IsOptional()
  @IsString()
  stateManagement?: string;

  @IsOptional()
  @IsString()
  buildTool?: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  otherTechnologies?: string[];
}

export class BackendStackDto {
  @IsOptional()
  @IsString()
  framework?: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsString()
  orm?: string;

  @IsOptional()
  @IsString()
  apiStyle?: string;

  @IsOptional()
  @IsArray()
  caching?: string[];

  @IsOptional()
  @IsArray()
  messageQueue?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  otherTechnologies?: string[];
}

export class InfrastructureStackDto {
  @IsOptional()
  @IsString()
  container?: string;

  @IsOptional()
  @IsString()
  orchestration?: string;

  @IsOptional()
  @IsString()
  reverseProxy?: string;

  @IsOptional()
  @IsString()
  loadBalancer?: string;
}

export class DevOpsStackDto {
  @IsOptional()
  @IsString()
  ciCd?: string;

  @IsOptional()
  @IsString()
  containerRegistry?: string;

  @IsOptional()
  @IsArray()
  monitoring?: string[];

  @IsOptional()
  @IsArray()
  logging?: string[];

  @IsOptional()
  @IsString()
  tracing?: string;

  @IsOptional()
  @IsArray()
  codeQuality?: string[];
}

export class WizardProgressDto {
  @IsString()
  projectId!: string;

  @IsNumber()
  currentStep!: number;

  @IsOptional()
  @IsBoolean()
  wizardCompleted?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => WizardStepDataDto)
  stepData?: WizardStepDataDto[];
}

export class WizardStepDataDto {
  @IsString()
  stepId!: string;

  @IsOptional()
  data?: Record<string, unknown>;
}

export class CreateProjectFromWizardDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  projectKey!: string;

  @IsOptional()
  @IsEnum(SystemType)
  systemType?: SystemType;

  @IsOptional()
  @IsEnum(ArchitectureType)
  architectureType?: ArchitectureType;

  @IsOptional()
  @ValidateNested()
  @Type(() => TechStackDto)
  techStack?: TechStackDto;

  @IsOptional()
  @IsArray()
  @IsEnum(DatabaseType, { each: true })
  databaseTypes?: DatabaseType[];

  @IsOptional()
  @IsEnum(CloudProvider)
  cloudProvider?: CloudProvider;

  @IsOptional()
  @IsEnum(SecurityLevel)
  securityLevel?: SecurityLevel;

  @IsOptional()
  @IsEnum(ProjectScale)
  projectScale?: ProjectScale;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10000)
  teamSize?: number;

  @IsOptional()
  @IsBoolean()
  isMicroservices?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(120)
  expectedDurationMonths?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  budget?: number;

  @IsOptional()
  @IsString()
  businessDomain?: string;

  @IsOptional()
  @IsString()
  targetAudience?: string;
}

export class TechStackSuggestionDto {
  @IsEnum(SystemType)
  systemType!: SystemType;

  @IsOptional()
  @IsEnum(ArchitectureType)
  architectureType?: ArchitectureType;
}

export class AISuggestionRequestDto {
  @IsString()
  stepId!: string;

  @IsOptional()
  context?: {
    projectName?: string;
    businessDomain?: string;
    description?: string;
    systemType?: SystemType;
  };
}

export class AISuggestionResponseDto {
  @IsString()
  stepId!: string;

  suggestions!: Record<string, unknown>;

  @IsOptional()
  @IsString()
  reason?: string;
}
