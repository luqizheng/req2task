import { TestSuiteResult } from '../types';

export function generateTestReport(suite: TestSuiteResult): string {
  const passed = suite.results.filter(r => r.status === 'passed').length;
  const failed = suite.results.filter(r => r.status === 'failed').length;
  const skipped = suite.results.filter(r => r.status === 'skipped').length;
  const total = suite.results.length;
  const passRate = ((passed / total) * 100).toFixed(1);

  const duration = suite.endTime.getTime() - suite.startTime.getTime();

  const rows = suite.results.map((result, i) => `
    <tr class="${result.status}">
      <td>${i + 1}</td>
      <td>${result.name}</td>
      <td class="status">
        <span class="badge ${result.status}">${result.status.toUpperCase()}</span>
      </td>
      <td>${result.duration}ms</td>
      <td>${result.screenshot ? `<a href="${result.screenshot}">查看</a>` : '-'}</td>
      <td>${result.error || '-'}</td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI配置管理测试报告</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; padding: 20px; }
    .container { max-width: 1200px; margin: 0 auto; }
    h1 { color: #333; margin-bottom: 20px; }
    .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-bottom: 20px; }
    .card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .card-label { font-size: 12px; color: #666; text-transform: uppercase; }
    .card-value { font-size: 28px; font-weight: bold; margin-top: 5px; }
    .passed .card-value { color: #22c55e; }
    .failed .card-value { color: #ef4444; }
    .skipped .card-value { color: #f59e0b; }
    .rate .card-value { color: #3b82f6; }
    table { width: 100%; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    th { background: #333; color: white; padding: 12px; text-align: left; }
    td { padding: 12px; border-bottom: 1px solid #eee; }
    tr:last-child td { border-bottom: none; }
    tr.passed td { background: #f0fdf4; }
    tr.failed td { background: #fef2f2; }
    .badge { padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
    .badge.passed { background: #22c55e; color: white; }
    .badge.failed { background: #ef4444; color: white; }
    .badge.skipped { background: #f59e0b; color: white; }
    .credentials { background: white; padding: 15px; border-radius: 8px; margin-top: 20px; }
    .credentials h3 { margin-bottom: 10px; }
    .credentials p { color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <h1>AI配置管理自动化测试报告</h1>

    <div class="summary">
      <div class="card passed">
        <div class="card-label">通过</div>
        <div class="card-value">${passed}</div>
      </div>
      <div class="card failed">
        <div class="card-label">失败</div>
        <div class="card-value">${failed}</div>
      </div>
      <div class="card skipped">
        <div class="card-label">跳过</div>
        <div class="card-value">${skipped}</div>
      </div>
      <div class="card rate">
        <div class="card-label">通过率</div>
        <div class="card-value">${passRate}%</div>
      </div>
      <div class="card">
        <div class="card-label">耗时</div>
        <div class="card-value">${duration}ms</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>测试步骤</th>
          <th>状态</th>
          <th>耗时</th>
          <th>截图</th>
          <th>错误信息</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>

    <div class="credentials">
      <h3>测试凭据</h3>
      <p>用户名: ${suite.credentials.username}</p>
      <p>密码: ${suite.credentials.password}</p>
      <p>测试时间: ${suite.startTime.toLocaleString()}</p>
    </div>
  </div>
</body>
</html>
`;
}
