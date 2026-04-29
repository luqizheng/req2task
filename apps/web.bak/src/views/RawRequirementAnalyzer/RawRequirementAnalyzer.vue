<script setup lang="ts">
import { ref, reactive } from 'vue';
import { 
  ElForm, 
  ElSelect, 
  ElOption, 
  ElInput, 
  ElDatePicker, 
  ElTag, 
  ElButton, 
  ElSteps, 
  ElStep, 
  ElCard, 
  ElDivider 
} from 'element-plus';
import { Check, Close } from '@element-plus/icons-vue';
import ViewContainer from '@/components/view-container.vue';

// 表单数据
const form = reactive({
  source: '客户访谈记录',
  collectionType: 'Interview',
  collectionTime: new Date('2024-01-15 14:30'),
  content: '客户反馈希望在系统中增加批量导入功能，支持Excel和CSV格式。用户表示当前逐条录入效率太低，特别是在项目初始化阶段需要导入大量历史数据。同时希望能有导入进度提示和错误报告功能，方便排查问题数据。另外提到移动端体验较差，希望能优化表单填写流程。',
});

// 关键词标签
const keywords = ref(['批量导入', 'Excel/CSV', '进度提示', '错误报告', '移动优化']);

// 步骤数据
const currentStep = ref(1);
const steps = [
  { title: '原始需求输入', description: '' },
  { title: '追问与澄清', description: '' },
  { title: '需求生成', description: '' },
];

// 问题数据
const questions = ref([
  {
    id: 1,
    question: '批量导入功能是否需要支持数据防脏处理？例如必传字段检查、格式验证、重复数据校验等？',
    purpose: '确认功能边界和数据质量要求',
    status: '已回答',
    answer: '需要支持必填字段校验和数据格式验证，导入前需要预览校验结果并允许用户修正。',
    isApproved: true
  },
  {
    id: 2,
    question: '移动端优化的重点是哪些页面或流程？是全部页面还是特定功能模块？',
    purpose: '明确移动端需求优先级和范围',
    status: '已跳过',
    answer: '',
    isApproved: false
  },
  {
    id: 3,
    question: '导入错误报告需要支持哪些导出格式？用户是否需要直接在系统内修正错误数据？',
    purpose: '确定错误处理机制和用户操作流程',
    status: '待回答',
    answer: '',
    isApproved: false
  }
]);

// 需求列表
const requirements = ref([
  {
    id: 1,
    title: '批量数据导入功能',
    description: '系统需支持通过Excel和CSV格式批量导入数据，包含数据预览、导入校验、格式验证和必填项检查功能，并提供实时进度提示。',
    actions: ['导入', '验证界面', '文件处理']
  },
  {
    id: 2,
    title: '导入错误报告与修正',
    description: '导入失败时生成详细错误报告，标注错误行号和原因。支持错误数据在线修正并重新导入，错误报告可导出为Excel格式。',
    actions: ['错误处理', '数据质量']
  },
  {
    id: 3,
    title: '移动端表单体验优化',
    description: '重新设计移动端数据录入表单，简化字段展示逻辑，支持分步填写和草稿保存，适配主流移动端浏览器交互规范。',
    actions: ['移动端', 'UX优化']
  }
]);

// 保存需求
const handleSave = () => {
  console.log('保存需求:', form);
};

// 开始分析
const handleAnalyze = () => {
  console.log('开始分析需求:', form);
};

// 提交回答
const handleSubmitAnswer = () => {
  console.log('提交回答:', questions.value[2].answer);
};

// 跳过问题
const handleSkip = () => {
  console.log('跳过问题');
};
</script>

<template>
  <ViewContainer title="原始需求分析" subtitle="多步骤需求处理流程" show-back>
    <div class="raw-requirement-analyzer-container">
      <!-- 步骤指示器 -->
      <div class="steps-container">
        <ElSteps :active="currentStep" direction="horizontal">
          <ElStep v-for="(step, index) in steps" :key="index" :title="step.title" :description="step.description" />
        </ElSteps>
      </div>
      
      <!-- 三栏布局 -->
      <div class="content-container">
        <!-- 左侧：原始需求输入 -->
        <div class="left-panel">
          <h3 class="panel-title">原始需求输入</h3>
          <ElForm :model="form" label-width="80px" size="small">
            <ElForm.Item label="来源">
              <ElSelect v-model="form.source" style="width: 100%">
                <ElOption label="客户访谈记录" value="客户访谈记录" />
                <ElOption label="内部会议" value="内部会议" />
                <ElOption label="邮件沟通" value="邮件沟通" />
              </ElSelect>
            </ElForm.Item>
            
            <ElForm.Item label="收集类型">
              <ElSelect v-model="form.collectionType" style="width: 100%">
                <ElOption label="Interview" value="Interview" />
                <ElOption label="Meeting" value="Meeting" />
                <ElOption label="Email" value="Email" />
              </ElSelect>
            </ElForm.Item>
            
            <ElForm.Item label="收集时间">
              <ElDatePicker 
                v-model="form.collectionTime" 
                type="datetime" 
                style="width: 100%"
                value-format="YYYY-MM-DD HH:mm"
              />
            </ElForm.Item>
            
            <ElForm.Item label="内容">
              <ElInput 
                v-model="form.content" 
                type="textarea" 
                :rows="6" 
                resize="none"
              />
            </ElForm.Item>
          </ElForm>
          
          <div class="keywords-section">
            <div class="section-title">关键词</div>
            <div class="keywords-wrapper">
              <ElTag 
                v-for="(keyword, index) in keywords" 
                :key="index" 
                size="small"
                effect="plain"
              >
                {{ keyword }}
              </ElTag>
            </div>
          </div>
          
          <div class="action-buttons">
            <ElButton size="small" @click="handleSave">保存</ElButton>
            <ElButton type="primary" size="small" @click="handleAnalyze">分析</ElButton>
          </div>
        </div>
        
        <!-- 中间：追问与澄清 -->
        <div class="middle-panel">
          <h3 class="panel-title">追问与澄清 <span class="step-info">2/3 已回答</span></h3>
          
          <div class="question-list">
            <!-- 问题1 -->
            <ElCard shadow="hover" class="question-card answered">
              <div class="question-header">
                <span class="question-number">Q1</span>
                <div class="question-status">
                  <Check class="status-icon approved" />
                  <span>已回答</span>
                </div>
              </div>
              <div class="question-content">
                {{ questions[0].question }}
              </div>
              <div class="question-purpose">
                <span class="purpose-label">目的：</span>
                {{ questions[0].purpose }}
              </div>
              <ElDivider />
              <div class="question-answer">
                {{ questions[0].answer }}
              </div>
            </ElCard>
            
            <!-- 问题2 -->
            <ElCard shadow="hover" class="question-card skipped">
              <div class="question-header">
                <span class="question-number">Q2</span>
                <div class="question-status">
                  <Close class="status-icon skipped" />
                  <span>已跳过</span>
                </div>
              </div>
              <div class="question-content">
                {{ questions[1].question }}
              </div>
              <div class="question-purpose">
                <span class="purpose-label">目的：</span>
                {{ questions[1].purpose }}
              </div>
              <ElDivider />
              <div class="question-note">
                此问题已跳过，将在下次提交时保留
              </div>
            </ElCard>
            
            <!-- 问题3 -->
            <ElCard shadow="hover" class="question-card pending">
              <div class="question-header">
                <span class="question-number">Q3</span>
                <div class="question-status">
                  <span>待回答</span>
                </div>
              </div>
              <div class="question-content">
                {{ questions[2].question }}
              </div>
              <div class="question-purpose">
                <span class="purpose-label">目的：</span>
                {{ questions[2].purpose }}
              </div>
              <ElDivider />
              <div class="question-input">
                <ElInput 
                  v-model="questions[2].answer" 
                  type="textarea" 
                  :rows="3" 
                  placeholder="请输入您的回答..."
                  resize="none"
                />
              </div>
              <div class="question-actions">
                <ElButton size="small" @click="handleSkip">跳过</ElButton>
                <ElButton type="primary" size="small" @click="handleSubmitAnswer">提交回答</ElButton>
              </div>
            </ElCard>
          </div>
        </div>
        
        <!-- 右侧：需求列表 -->
        <div class="right-panel">
          <h3 class="panel-title">3 条需求</h3>
          
          <div class="requirement-list">
            <div 
              v-for="requirement in requirements" 
              :key="requirement.id" 
              class="requirement-item"
            >
              <div class="requirement-header">
                <span class="requirement-number">{{ requirement.id }}</span>
                <h4 class="requirement-title">{{ requirement.title }}</h4>
              </div>
              <div class="requirement-description">
                {{ requirement.description }}
              </div>
              <div class="requirement-actions">
                <ElTag 
                  v-for="(action, index) in requirement.actions" 
                  :key="index" 
                  size="small"
                  effect="plain"
                >
                  {{ action }}
                </ElTag>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </ViewContainer>
</template>

<style scoped>
.raw-requirement-analyzer-container {
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.steps-container {
  margin-bottom: 20px;
}

.content-container {
  display: flex;
  gap: 20px;
  flex: 1;
  overflow: hidden;
}

/* 左侧面板 */
.left-panel {
  width: 300px;
  padding: 16px;
  border: 1px solid #EBEEF5;
  border-radius: 4px;
  background-color: #FFFFFF;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
}

/* 中间面板 */
.middle-panel {
  flex: 1;
  padding: 16px;
  border: 1px solid #EBEEF5;
  border-radius: 4px;
  background-color: #FFFFFF;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
}

/* 右侧面板 */
.right-panel {
  width: 300px;
  padding: 16px;
  border: 1px solid #EBEEF5;
  border-radius: 4px;
  background-color: #FFFFFF;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
}

.panel-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  padding-bottom: 8px;
  border-bottom: 1px solid #EBEEF5;
}

.step-info {
  font-size: 12px;
  font-weight: normal;
  color: #606266;
  margin-left: 8px;
}

/* 关键词样式 */
.keywords-section {
  margin-top: 8px;
}

.section-title {
  font-size: 12px;
  font-weight: 500;
  color: #606266;
  margin-bottom: 8px;
}

.keywords-wrapper {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

/* 问题列表 */
.question-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.question-card {
  border-radius: 4px;
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.question-number {
  font-weight: 600;
  color: #409EFF;
}

.question-status {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
}

.status-icon {
  font-size: 14px;
}

.status-icon.approved {
  color: #67C23A;
}

.status-icon.skipped {
  color: #909399;
}

.question-content {
  margin-bottom: 8px;
  line-height: 1.5;
}

.question-purpose {
  font-size: 12px;
  color: #606266;
  margin-bottom: 8px;
}

.purpose-label {
  font-weight: 500;
}

.question-answer {
  padding: 8px;
  background-color: #F5F7FA;
  border-radius: 4px;
  line-height: 1.5;
}

.question-note {
  font-size: 12px;
  color: #909399;
  padding: 8px;
  background-color: #F5F7FA;
  border-radius: 4px;
}

.question-input {
  margin-bottom: 12px;
}

.question-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

/* 需求列表 */
.requirement-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.requirement-item {
  padding: 12px;
  border: 1px solid #EBEEF5;
  border-radius: 4px;
  background-color: #FFFFFF;
}

.requirement-header {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 8px;
}

.requirement-number {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #409EFF;
  color: #FFFFFF;
  border-radius: 50%;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}

.requirement-title {
  font-size: 14px;
  font-weight: 600;
  margin: 0;
  flex: 1;
}

.requirement-description {
  font-size: 12px;
  line-height: 1.5;
  margin-bottom: 12px;
  color: #606266;
}

.requirement-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
</style>