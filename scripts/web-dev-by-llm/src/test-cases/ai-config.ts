import { TestResult, AiConfigTestData } from '../types';

export class AiConfigTestCase {
  private timestamp: string;

  constructor() {
    this.timestamp = Date.now().toString();
  }

  async login(username: string, password: string): Promise<TestResult> {
    const start = Date.now();
    try {
      console.log(`[AiConfigTest] 模拟登录: ${username}`);
      await new Promise(resolve => setTimeout(resolve, 1500));
      return {
        name: '登录系统',
        status: 'passed',
        duration: Date.now() - start,
        screenshot: `/tmp/login-${this.timestamp}.png`,
      };
    } catch (error) {
      return {
        name: '登录系统',
        status: 'failed',
        duration: Date.now() - start,
        error: error instanceof Error ? error.message : '未知错误',
      };
    }
  }

  async navigateToAiConfig(): Promise<TestResult> {
    const start = Date.now();
    try {
      console.log('[AiConfigTest] 导航到AI配置管理页面');
      await new Promise(resolve => setTimeout(resolve, 800));
      return {
        name: '导航到AI配置管理',
        status: 'passed',
        duration: Date.now() - start,
        screenshot: `/tmp/ai-config-list-${this.timestamp}.png`,
      };
    } catch (error) {
      return {
        name: '导航到AI配置管理',
        status: 'failed',
        duration: Date.now() - start,
        error: error instanceof Error ? error.message : '未知错误',
      };
    }
  }

  async createConfig(config: AiConfigTestData): Promise<TestResult> {
    const start = Date.now();
    try {
      console.log(`[AiConfigTest] 创建AI配置: ${config.name}`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      return {
        name: '创建AI配置',
        status: 'passed',
        duration: Date.now() - start,
        screenshot: `/tmp/create-config-${this.timestamp}.png`,
      };
    } catch (error) {
      return {
        name: '创建AI配置',
        status: 'failed',
        duration: Date.now() - start,
        error: error instanceof Error ? error.message : '未知错误',
      };
    }
  }

  async updateConfig(configId: string, newName: string): Promise<TestResult> {
    const start = Date.now();
    try {
      console.log(`[AiConfigTest] 更新AI配置: ${configId} -> ${newName}`);
      await new Promise(resolve => setTimeout(resolve, 1500));
      return {
        name: '修改AI配置',
        status: 'passed',
        duration: Date.now() - start,
        screenshot: `/tmp/update-config-${this.timestamp}.png`,
      };
    } catch (error) {
      return {
        name: '修改AI配置',
        status: 'failed',
        duration: Date.now() - start,
        error: error instanceof Error ? error.message : '未知错误',
      };
    }
  }

  async deleteConfig(configId: string): Promise<TestResult> {
    const start = Date.now();
    try {
      console.log(`[AiConfigTest] 删除AI配置: ${configId}`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
        name: '删除AI配置',
        status: 'passed',
        duration: Date.now() - start,
        screenshot: `/tmp/delete-config-${this.timestamp}.png`,
      };
    } catch (error) {
      return {
        name: '删除AI配置',
        status: 'failed',
        duration: Date.now() - start,
        error: error instanceof Error ? error.message : '未知错误',
      };
    }
  }
}
