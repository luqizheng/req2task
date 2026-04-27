import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import type { 
  Project, 
  RawRequirement, 
  Requirement, 
  Module, 
  Task, 
  RequirementAnalysis 
} from './types';

export function useReq2TaskDemo() {
  // 活跃标签页
  const activeTab = ref('project');

  // 文件上传演示
  const demoFileIds = ref<string[]>([]);
  const demoTargetType = ref<'collection' | 'raw_requirement' | 'project'>('project');
  const demoTargetId = ref('demo-project-123');

  const handleUploadComplete = (fileIds: string[]) => {
    console.log('文件上传完成，文件ID:', fileIds);
    ElMessage.success(`成功上传 ${fileIds.length} 个文件`);
  };

  const handleRemoveFile = (fileId: string) => {
    console.log('移除文件:', fileId);
    ElMessage.info(`已移除文件 ${fileId}`);
  };

  // 项目数据
  const projects = ref<Project[]>([
    { id: 1, name: '电商平台重构', description: '基于Vue 3和NestJS的电商平台重构项目', status: '进行中', startDate: '2024-01-15', endDate: '2024-06-30', progress: 65 },
    { id: 2, name: '智能办公系统', description: '集成AI助手的企业办公自动化系统', status: '规划中', startDate: '2024-03-01', endDate: '2024-09-30', progress: 10 },
    { id: 3, name: '移动应用开发', description: '跨平台移动应用开发项目', status: '已完成', startDate: '2023-09-01', endDate: '2024-02-28', progress: 100 },
  ]);

  // 原始需求数据
  const rawRequirements = ref<RawRequirement[]>([
    { id: 1, title: '用户登录功能', description: '实现用户登录、注册、忘记密码功能', source: '客户需求文档', status: '待分析', priority: '高' },
    { id: 2, title: '商品搜索功能', description: '实现商品关键词搜索、分类筛选、排序功能', source: '产品经理', status: '分析中', priority: '中' },
    { id: 3, title: '购物车功能', description: '实现商品添加、删除、数量修改、结算功能', source: '用户反馈', status: '已分析', priority: '高' },
  ]);

  // 需求数据
  const requirements = ref<Requirement[]>([
    { id: 1, title: '用户认证模块', description: '实现基于JWT的用户认证系统', status: '已批准', priority: '高', type: '功能需求', module: '用户管理' },
    { id: 2, title: '商品管理功能', description: '实现商品的CRUD操作和库存管理', status: '开发中', priority: '中', type: '功能需求', module: '商品管理' },
    { id: 3, title: '系统性能优化', description: '优化系统响应速度和并发处理能力', status: '待开发', priority: '中', type: '非功能需求', module: '系统架构' },
  ]);

  // 模块数据
  const modules = ref<Module[]>([
    { id: 1, name: '用户管理', description: '用户认证、权限管理、个人信息', projectId: 1, status: '开发中', progress: 75 },
    { id: 2, name: '商品管理', description: '商品信息、分类、库存管理', projectId: 1, status: '开发中', progress: 60 },
    { id: 3, name: '订单管理', description: '订单创建、支付、物流跟踪', projectId: 1, status: '待开发', progress: 0 },
  ]);

  // 任务数据
  const tasks = ref<Task[]>([
    { id: 1, title: '用户登录页面开发', description: '开发用户登录页面UI和交互', status: '已完成', assignee: '张三', priority: '高', deadline: '2024-02-15' },
    { id: 2, title: '商品列表API开发', description: '开发商品列表查询接口', status: '进行中', assignee: '李四', priority: '中', deadline: '2024-02-28' },
    { id: 3, title: '购物车逻辑实现', description: '实现购物车的添加、删除、更新功能', status: '待分配', assignee: '', priority: '高', deadline: '2024-03-15' },
  ]);

  // 需求分析数据
  const requirementAnalysis = ref<RequirementAnalysis>({
    projectName: '电商平台重构',
    analysisDate: '2024-02-20',
    analyst: '王五',
    summary: '本需求分析基于客户提供的需求文档和产品经理的补充说明，涵盖了用户认证、商品管理、订单处理等核心功能模块。',
    functionalRequirements: [
      { id: 1, title: '用户认证', description: '实现用户注册、登录、忘记密码功能', priority: '高' },
      { id: 2, title: '商品浏览', description: '实现商品列表、详情、搜索功能', priority: '高' },
      { id: 3, title: '购物车', description: '实现商品添加、删除、结算功能', priority: '中' },
    ],
    nonFunctionalRequirements: [
      { id: 1, title: '性能要求', description: '系统响应时间不超过2秒', priority: '高' },
      { id: 2, title: '安全要求', description: '数据传输采用HTTPS加密', priority: '高' },
      { id: 3, title: '兼容性', description: '支持主流浏览器和移动设备', priority: '中' },
    ],
    risks: [
      { id: 1, description: '需求变更可能导致项目延期', mitigation: '建立变更管理流程' },
      { id: 2, description: '技术选型风险', mitigation: '进行技术预研和原型开发' },
    ],
  });

  // 编辑状态
  const editDialogVisible = ref(false);
  const currentItem = ref<any>(null);
  const editType = ref<string>('');

  const openEditDialog = (type: string, item?: any) => {
    editType.value = type;
    currentItem.value = item ? { ...item } : null;
    editDialogVisible.value = true;
  };

  const closeEditDialog = () => {
    editDialogVisible.value = false;
    currentItem.value = null;
  };

  const saveItem = () => {
    // 模拟保存逻辑
    console.log('保存', editType.value, currentItem.value);
    ElMessage.success('保存成功');
    closeEditDialog();
  };

  return {
    activeTab,
    demoFileIds,
    demoTargetType,
    demoTargetId,
    handleUploadComplete,
    handleRemoveFile,
    projects,
    rawRequirements,
    requirements,
    modules,
    tasks,
    requirementAnalysis,
    editDialogVisible,
    currentItem,
    editType,
    openEditDialog,
    closeEditDialog,
    saveItem
  };
}
