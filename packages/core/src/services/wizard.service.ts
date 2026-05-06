import {
  WizardStepDto,
  WizardProgressDto,
  TechStackDto,
  AISuggestionRequestDto,
  AISuggestionResponseDto,
} from '@req2task/dto';
import {
  SystemType,
  ArchitectureType,
  DatabaseType,
  CloudProvider,
  SecurityLevel,
  ProjectScale,
} from '../entities/project.entity';

export class WizardService {
  private readonly wizardSteps: WizardStepDto[] = [
    {
      id: 'step-1-basic',
      title: '项目基础信息',
      description: '填写项目的基本信息',
      fields: [
        {
          key: 'name',
          type: 'text',
          label: '项目名称',
          placeholder: '请输入项目名称',
          required: true,
        },
        {
          key: 'description',
          type: 'text',
          label: '项目描述',
          placeholder: '请简单描述项目背景',
          required: false,
        },
        {
          key: 'businessDomain',
          type: 'text',
          label: '业务领域',
          placeholder: '例如：电商、金融、医疗',
          required: false,
          aiGenerated: true,
        },
      ],
    },
    {
      id: 'step-2-system-type',
      title: '系统类型识别',
      description: '识别项目的系统类型',
      fields: [
        {
          key: 'systemType',
          type: 'select',
          label: '系统类型',
          placeholder: '请选择系统类型',
          required: true,
          options: Object.values(SystemType).map((v) => ({
            value: v,
            label: this.getSystemTypeLabel(v),
          })),
          aiSuggestion: true,
        },
        {
          key: 'targetAudience',
          type: 'text',
          label: '目标用户',
          placeholder: '请描述目标用户群体',
          required: false,
        },
      ],
    },
    {
      id: 'step-3-architecture',
      title: '架构决策',
      description: '选择合适的系统架构',
      fields: [
        {
          key: 'architectureType',
          type: 'select',
          label: '架构类型',
          placeholder: '请选择架构类型',
          required: true,
          options: Object.values(ArchitectureType).map((v) => ({
            value: v,
            label: this.getArchitectureTypeLabel(v),
          })),
          aiSuggestion: true,
        },
        {
          key: 'isMicroservices',
          type: 'boolean',
          label: '是否采用微服务架构',
          required: false,
        },
      ],
    },
    {
      id: 'step-4-tech-stack',
      title: '技术栈选择',
      description: '选择项目使用的技术栈',
      fields: [
        {
          key: 'frontend.framework',
          type: 'select',
          label: '前端框架',
          placeholder: '请选择前端框架',
          required: false,
          options: [
            { value: 'Vue3', label: 'Vue 3' },
            { value: 'React', label: 'React' },
            { value: 'Angular', label: 'Angular' },
            { value: 'Svelte', label: 'Svelte' },
            { value: 'Next.js', label: 'Next.js' },
            { value: 'Nuxt', label: 'Nuxt' },
          ],
          aiSuggestion: true,
        },
        {
          key: 'backend.framework',
          type: 'select',
          label: '后端框架',
          placeholder: '请选择后端框架',
          required: false,
          options: [
            { value: 'NestJS', label: 'NestJS' },
            { value: 'Express', label: 'Express' },
            { value: 'Fastify', label: 'Fastify' },
            { value: 'Spring Boot', label: 'Spring Boot' },
            { value: 'Django', label: 'Django' },
            { value: 'Gin', label: 'Gin' },
          ],
          aiSuggestion: true,
        },
        {
          key: 'backend.language',
          type: 'select',
          label: '编程语言',
          placeholder: '请选择编程语言',
          required: false,
          options: [
            { value: 'TypeScript', label: 'TypeScript' },
            { value: 'JavaScript', label: 'JavaScript' },
            { value: 'Java', label: 'Java' },
            { value: 'Python', label: 'Python' },
            { value: 'Go', label: 'Go' },
            { value: 'Rust', label: 'Rust' },
          ],
          aiSuggestion: true,
        },
      ],
    },
    {
      id: 'step-5-database',
      title: '数据库配置',
      description: '选择项目使用的数据库',
      fields: [
        {
          key: 'databaseTypes',
          type: 'multiselect',
          label: '数据库类型',
          placeholder: '请选择数据库类型',
          required: true,
          options: Object.values(DatabaseType).map((v) => ({
            value: v,
            label: v,
          })),
          aiSuggestion: true,
        },
        {
          key: 'backend.orm',
          type: 'select',
          label: 'ORM 框架',
          placeholder: '请选择 ORM 框架',
          required: false,
          options: [
            { value: 'TypeORM', label: 'TypeORM' },
            { value: 'Prisma', label: 'Prisma' },
            { value: 'Sequelize', label: 'Sequelize' },
            { value: 'Drizzle', label: 'Drizzle' },
            { value: 'None', label: '不使用 ORM' },
          ],
        },
      ],
    },
    {
      id: 'step-6-deployment',
      title: '部署配置',
      description: '配置项目部署环境',
      fields: [
        {
          key: 'cloudProvider',
          type: 'select',
          label: '云服务商',
          placeholder: '请选择云服务商',
          required: false,
          options: Object.values(CloudProvider).map((v) => ({
            value: v,
            label: this.getCloudProviderLabel(v),
          })),
        },
        {
          key: 'securityLevel',
          type: 'select',
          label: '安全等级',
          placeholder: '请选择安全等级',
          required: false,
          options: Object.values(SecurityLevel).map((v) => ({
            value: v,
            label: this.getSecurityLevelLabel(v),
          })),
        },
      ],
    },
    {
      id: 'step-7-scale',
      title: '项目规模',
      description: '评估项目规模和团队配置',
      fields: [
        {
          key: 'projectScale',
          type: 'select',
          label: '项目规模',
          placeholder: '请选择项目规模',
          required: true,
          options: Object.values(ProjectScale).map((v) => ({
            value: v,
            label: this.getProjectScaleLabel(v),
          })),
        },
        {
          key: 'teamSize',
          type: 'number',
          label: '团队人数',
          placeholder: '请输入团队人数',
          required: false,
          validation: {
            min: 1,
            max: 10000,
            message: '团队人数应在 1-10000 之间',
          },
        },
        {
          key: 'expectedDurationMonths',
          type: 'number',
          label: '预计开发周期（月）',
          placeholder: '请输入预计周期',
          required: false,
          validation: {
            min: 1,
            max: 120,
            message: '周期应在 1-120 个月之间',
          },
        },
      ],
    },
    {
      id: 'step-8-confirm',
      title: '完成确认',
      description: '确认项目配置并创建',
      fields: [],
      aiSuggestion: false,
    },
  ];

  async getWizardSteps(): Promise<WizardStepDto[]> {
    return this.wizardSteps;
  }

  async getWizardStep(stepId: string): Promise<WizardStepDto | null> {
    return this.wizardSteps.find((step) => step.id === stepId) || null;
  }

  async suggestTechStack(
    systemType: SystemType,
    _architectureType?: ArchitectureType,
  ): Promise<TechStackDto> {
    const suggestions: Record<SystemType, TechStackDto> = {
      [SystemType.ECOMMERCE]: {
        frontend: {
          framework: 'Vue3',
          uiLibrary: 'Element Plus',
          stateManagement: 'Pinia',
          buildTool: 'Vite',
          language: 'TypeScript',
        },
        backend: {
          framework: 'NestJS',
          language: 'TypeScript',
          orm: 'TypeORM',
          apiStyle: 'REST',
          caching: ['Redis'],
          messageQueue: ['RabbitMQ'],
        },
        infrastructure: {
          container: 'Docker',
          orchestration: 'Kubernetes',
          reverseProxy: 'Nginx',
        },
        devops: {
          ciCd: 'GitHub Actions',
          monitoring: ['Prometheus', 'Grafana'],
          logging: ['ELK'],
        },
      },
      [SystemType.CMS]: {
        frontend: {
          framework: 'Vue3',
          uiLibrary: 'Naive UI',
          stateManagement: 'Pinia',
          buildTool: 'Vite',
          language: 'TypeScript',
        },
        backend: {
          framework: 'NestJS',
          language: 'TypeScript',
          orm: 'TypeORM',
          apiStyle: 'REST',
        },
        infrastructure: {
          container: 'Docker',
          reverseProxy: 'Nginx',
        },
        devops: {
          ciCd: 'GitLab CI',
        },
      },
      [SystemType.ERP]: {
        frontend: {
          framework: 'Vue3',
          uiLibrary: 'Element Plus',
          stateManagement: 'Pinia',
          language: 'TypeScript',
        },
        backend: {
          framework: 'Spring Boot',
          language: 'Java',
          orm: 'Hibernate',
          apiStyle: 'REST',
          caching: ['Redis'],
        },
        infrastructure: {
          container: 'Docker',
          orchestration: 'Kubernetes',
        },
        devops: {
          ciCd: 'Jenkins',
          monitoring: ['Prometheus', 'Grafana'],
        },
      },
      [SystemType.CRM]: {
        frontend: {
          framework: 'React',
          uiLibrary: 'Ant Design',
          stateManagement: 'Redux',
          language: 'TypeScript',
        },
        backend: {
          framework: 'NestJS',
          language: 'TypeScript',
          orm: 'TypeORM',
          apiStyle: 'GraphQL',
        },
        infrastructure: {
          container: 'Docker',
        },
        devops: {
          ciCd: 'GitHub Actions',
        },
      },
      [SystemType.OA]: {
        frontend: {
          framework: 'Vue3',
          uiLibrary: 'Element Plus',
          language: 'TypeScript',
        },
        backend: {
          framework: 'Spring Boot',
          language: 'Java',
        },
        infrastructure: {
          container: 'Docker',
        },
        devops: {
          ciCd: 'Jenkins',
        },
      },
      [SystemType.LMS]: {
        frontend: {
          framework: 'React',
          uiLibrary: 'Material UI',
          language: 'TypeScript',
        },
        backend: {
          framework: 'NestJS',
          language: 'TypeScript',
          orm: 'Prisma',
        },
        infrastructure: {
          container: 'Docker',
        },
        devops: {
          ciCd: 'GitHub Actions',
        },
      },
      [SystemType.MES]: {
        frontend: {
          framework: 'Vue3',
          uiLibrary: 'Element Plus',
          language: 'TypeScript',
        },
        backend: {
          framework: 'Spring Boot',
          language: 'Java',
        },
        infrastructure: {
          container: 'Docker',
          orchestration: 'Kubernetes',
        },
        devops: {
          ciCd: 'Jenkins',
        },
      },
      [SystemType.SCM]: {
        frontend: {
          framework: 'React',
          uiLibrary: 'Ant Design',
          language: 'TypeScript',
        },
        backend: {
          framework: 'Spring Boot',
          language: 'Java',
        },
        infrastructure: {
          container: 'Docker',
          orchestration: 'Kubernetes',
        },
        devops: {
          ciCd: 'Jenkins',
        },
      },
      [SystemType.HEALTHCARE]: {
        frontend: {
          framework: 'Vue3',
          uiLibrary: 'Naive UI',
          language: 'TypeScript',
        },
        backend: {
          framework: 'NestJS',
          language: 'TypeScript',
          apiStyle: 'GraphQL',
        },
        infrastructure: {
          container: 'Docker',
          orchestration: 'Kubernetes',
        },
        devops: {
          ciCd: 'GitLab CI',
          monitoring: ['Prometheus', 'Grafana'],
        },
      },
      [SystemType.FINTECH]: {
        frontend: {
          framework: 'React',
          uiLibrary: 'Ant Design',
          language: 'TypeScript',
        },
        backend: {
          framework: 'NestJS',
          language: 'TypeScript',
          apiStyle: 'gRPC',
        },
        infrastructure: {
          container: 'Docker',
          orchestration: 'Kubernetes',
        },
        devops: {
          ciCd: 'GitLab CI',
          monitoring: ['Prometheus', 'Grafana'],
          logging: ['ELK'],
        },
      },
      [SystemType.IOT]: {
        frontend: {
          framework: 'Vue3',
          uiLibrary: 'Naive UI',
          language: 'TypeScript',
        },
        backend: {
          framework: 'Gin',
          language: 'Go',
          messageQueue: ['Kafka'],
        },
        infrastructure: {
          container: 'Docker',
          orchestration: 'Kubernetes',
        },
        devops: {
          ciCd: 'GitHub Actions',
          monitoring: ['Prometheus', 'Grafana'],
        },
      },
      [SystemType.GAMING]: {
        frontend: {
          framework: 'React',
          language: 'TypeScript',
        },
        backend: {
          framework: 'NestJS',
          language: 'TypeScript',
          messageQueue: ['Redis Streams'],
        },
        infrastructure: {
          container: 'Docker',
        },
        devops: {
          ciCd: 'GitHub Actions',
        },
      },
      [SystemType.SOCIAL]: {
        frontend: {
          framework: 'React',
          uiLibrary: 'Ant Design',
          language: 'TypeScript',
        },
        backend: {
          framework: 'NestJS',
          language: 'TypeScript',
          messageQueue: ['Kafka'],
        },
        infrastructure: {
          container: 'Docker',
          orchestration: 'Kubernetes',
        },
        devops: {
          ciCd: 'GitHub Actions',
          monitoring: ['Prometheus', 'Grafana'],
        },
      },
      [SystemType.EDUCATION]: {
        frontend: {
          framework: 'Vue3',
          uiLibrary: 'Naive UI',
          language: 'TypeScript',
        },
        backend: {
          framework: 'NestJS',
          language: 'TypeScript',
        },
        infrastructure: {
          container: 'Docker',
        },
        devops: {
          ciCd: 'GitHub Actions',
        },
      },
      [SystemType.CUSTOM]: {
        frontend: {
          framework: 'Vue3',
          language: 'TypeScript',
        },
        backend: {
          framework: 'NestJS',
          language: 'TypeScript',
        },
        infrastructure: {
          container: 'Docker',
        },
        devops: {
          ciCd: 'GitHub Actions',
        },
      },
    };

    return suggestions[systemType] || suggestions[SystemType.CUSTOM];
  }

  async getAISuggestion(request: AISuggestionRequestDto): Promise<AISuggestionResponseDto> {
    const step = await this.getWizardStep(request.stepId);
    if (!step) {
      throw new Error('Step not found');
    }

    const suggestions: Record<string, unknown> = {};

    if (request.context?.systemType) {
      const techStack = await this.suggestTechStack(
        request.context.systemType,
      );
      suggestions.techStack = techStack;
    }

    return {
      stepId: request.stepId,
      suggestions,
      reason: '基于项目类型和上下文的智能推荐',
    };
  }

  private getSystemTypeLabel(type: SystemType): string {
    const labels: Record<SystemType, string> = {
      [SystemType.ECOMMERCE]: '电商系统',
      [SystemType.CMS]: '内容管理系统',
      [SystemType.ERP]: '企业资源计划',
      [SystemType.CRM]: '客户关系管理',
      [SystemType.OA]: '办公自动化',
      [SystemType.LMS]: '学习管理系统',
      [SystemType.MES]: '制造执行系统',
      [SystemType.SCM]: '供应链管理',
      [SystemType.HEALTHCARE]: '医疗健康系统',
      [SystemType.FINTECH]: '金融科技',
      [SystemType.IOT]: '物联网平台',
      [SystemType.GAMING]: '游戏平台',
      [SystemType.SOCIAL]: '社交平台',
      [SystemType.EDUCATION]: '在线教育',
      [SystemType.CUSTOM]: '定制开发',
    };
    return labels[type];
  }

  private getArchitectureTypeLabel(type: ArchitectureType): string {
    const labels: Record<ArchitectureType, string> = {
      [ArchitectureType.MONOLITHIC]: '单体架构',
      [ArchitectureType.MICROSERVICE]: '微服务架构',
      [ArchitectureType.SERVERLESS]: '无服务器架构',
      [ArchitectureType.MICROSERVICE_MONO_REPO]: '微服务单体仓库',
      [ArchitectureType.MODULAR_MONOLITH]: '模块化单体',
      [ArchitectureType.EVENT_DRIVEN]: '事件驱动架构',
      [ArchitectureType.LAYERED]: '分层架构',
      [ArchitectureType.HEXAGONAL]: '六边形架构',
      [ArchitectureType.DDD]: '领域驱动设计',
    };
    return labels[type];
  }

  private getCloudProviderLabel(provider: CloudProvider): string {
    const labels: Record<CloudProvider, string> = {
      [CloudProvider.ALIYUN]: '阿里云',
      [CloudProvider.TENCENT]: '腾讯云',
      [CloudProvider.HUAWEI]: '华为云',
      [CloudProvider.AWS]: '亚马逊云 AWS',
      [CloudProvider.GCP]: '谷歌云 GCP',
      [CloudProvider.AZURE]: '微软云 Azure',
      [CloudProvider.SELF_HOSTED]: '自托管',
    };
    return labels[provider];
  }

  private getSecurityLevelLabel(level: SecurityLevel): string {
    const labels: Record<SecurityLevel, string> = {
      [SecurityLevel.BASIC]: '基础安全',
      [SecurityLevel.STANDARD]: '标准安全',
      [SecurityLevel.ENHANCED]: '增强安全',
      [SecurityLevel.HIGH]: '高级安全（金融/医疗）',
    };
    return labels[level];
  }

  private getProjectScaleLabel(scale: ProjectScale): string {
    const labels: Record<ProjectScale, string> = {
      [ProjectScale.SMALL]: '小型 (< 10人)',
      [ProjectScale.MEDIUM]: '中型 (10-50人)',
      [ProjectScale.LARGE]: '大型 (50-200人)',
      [ProjectScale.ENTERPRISE]: '企业级 (> 200人)',
    };
    return labels[scale];
  }

  async saveWizardProgress(_progress: WizardProgressDto): Promise<any> {
    throw new Error('saveWizardProgress not implemented - use ProjectsService directly');
  }

  async getWizardProgress(_projectId: string): Promise<WizardProgressDto | null> {
    throw new Error('getWizardProgress not implemented - use ProjectsService directly');
  }
}
