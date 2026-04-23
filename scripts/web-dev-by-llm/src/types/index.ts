export interface TestCredentials {
  username: string;
  password: string;
}

export interface TestResult {
  name: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: string;
  screenshot?: string;
}

export interface TestSuiteResult {
  name: string;
  startTime: Date;
  endTime: Date;
  results: TestResult[];
  credentials: TestCredentials;
}

export interface TestReport {
  suite: TestSuiteResult;
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  passRate: number;
  generatedAt: Date;
}

export interface AiConfigTestData {
  name: string;
  provider: string;
  model: string;
  apiKey?: string;
  endpoint?: string;
}
