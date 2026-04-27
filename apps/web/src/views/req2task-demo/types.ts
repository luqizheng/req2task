// 项目类型
export interface Project {
  id: number;
  name: string;
  description: string;
  status: '规划中' | '进行中' | '已完成';
  startDate: string;
  endDate: string;
  progress: number;
}

// 原始需求类型
export interface RawRequirement {
  id: number;
  title: string;
  description: string;
  source: string;
  status: '待分析' | '分析中' | '已分析';
  priority: '高' | '中' | '低';
}

// 需求类型
export interface Requirement {
  id: number;
  title: string;
  description: string;
  status: '待批准' | '已批准' | '开发中' | '已完成' | '待开发';
  priority: '高' | '中' | '低';
  type: '功能需求' | '非功能需求';
  module: string;
}

// 模块类型
export interface Module {
  id: number;
  name: string;
  description: string;
  projectId: number;
  status: '待开发' | '开发中' | '已完成';
  progress: number;
}

// 任务类型
export interface Task {
  id: number;
  title: string;
  description: string;
  status: '待分配' | '进行中' | '已完成';
  assignee: string;
  priority: '高' | '中' | '低';
  deadline: string;
}

// 分析项类型
export interface AnalysisItem {
  id: number;
  title: string;
  description: string;
  priority?: '高' | '中' | '低';
}

// 风险类型
export interface Risk {
  id: number;
  description: string;
  mitigation: string;
}

// 需求分析类型
export interface RequirementAnalysis {
  projectName: string;
  analysisDate: string;
  analyst: string;
  summary: string;
  functionalRequirements: AnalysisItem[];
  nonFunctionalRequirements: AnalysisItem[];
  risks: Risk[];
}
