#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { platform } from 'os';
import { Client } from 'pg';

interface CheckResult {
  name: string;
  required: string;
  version: string | null;
  passed: boolean;
  message: string;
}

const isWindows = platform() === 'win32';

function runCommand(cmd: string): { version: string | null; success: boolean } {
  try {
    const output = execSync(cmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
    const version = output.trim().split('\n')[0];
    return { version, success: true };
  } catch (error) {
    return { version: null, success: false };
  }
}

function checkDocker(): CheckResult {
  const result = runCommand('docker --version');
  if (result.success) {
    return {
      name: 'Docker',
      required: 'installed',
      version: result.version,
      passed: true,
      message: `${result.version}`
    };
  }
  return {
    name: 'Docker',
    required: 'installed',
    version: null,
    passed: false,
    message: 'Docker is not installed or not in PATH'
  };
}

function checkDockerCompose(): CheckResult {
  const commands = isWindows
    ? ['docker-compose --version', 'docker compose version']
    : ['docker-compose --version', 'docker compose version'];

  for (const cmd of commands) {
    const result = runCommand(cmd);
    if (result.success) {
      return {
        name: 'Docker Compose',
        required: 'installed',
        version: result.version,
        passed: true,
        message: result.version ?? 'installed'
      };
    }
  }
  return {
    name: 'Docker Compose',
    required: 'installed',
    version: null,
    passed: false,
    message: 'Docker Compose is not installed or not in PATH'
  };
}

function checkNodejs(): CheckResult {
  const result = runCommand('node --version');
  if (result.success && result.version) {
    const version = result.version.replace('v', '');
    const major = parseInt(version.split('.')[0]);
    const minMajor = 18;
    const passed = major >= minMajor;
    return {
      name: 'Node.js',
      required: `>=${minMajor}.x`,
      version: version,
      passed,
      message: passed ? version : `Version ${version} is too old, need >=${minMajor}.x`
    };
  }
  return {
    name: 'Node.js',
    required: '>=18.x',
    version: null,
    passed: false,
    message: 'Node.js is not installed or not in PATH'
  };
}

function checkPnpm(): CheckResult {
  const result = runCommand('pnpm --version');
  if (result.success && result.version) {
    const version = result.version ?? '';
    const major = parseInt(version.split('.')[0]);
    const minMajor = 8;
    const passed = major >= minMajor;
    return {
      name: 'pnpm',
      required: `>=${minMajor}.0`,
      version,
      passed,
      message: passed ? version : `Version ${version} is too old, need >=${minMajor}.0`
    };
  }
  return {
    name: 'pnpm',
    required: '>=8.0',
    version: null,
    passed: false,
    message: 'pnpm is not installed or not in PATH. Run: npm install -g pnpm'
  };
}

function checkGit(): CheckResult {
  const result = runCommand('git --version');
  if (result.success) {
    return {
      name: 'Git',
      required: 'installed',
      version: result.version,
      passed: true,
      message: result.version ?? 'installed'
    };
  }
  return {
    name: 'Git',
    required: 'installed',
    version: null,
    passed: false,
    message: 'Git is not installed or not in PATH'
  };
}

interface DbConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

function parseEnvFile(filePath: string): Record<string, string> {
  const env: Record<string, string> = {};
  if (!existsSync(filePath)) {
    return env;
  }
  const content = readFileSync(filePath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [key, ...valueParts] = trimmed.split('=');
    if (key && valueParts.length > 0) {
      env[key] = valueParts.join('=');
    }
  }
  return env;
}

function getDbConfig(): DbConfig | null {
  const envPath = 'apps/service/.env';
  const env = parseEnvFile(envPath);
  if (!env.DB_HOST || !env.DB_PORT || !env.DB_USER || !env.DB_PASSWORD || !env.DB_NAME) {
    return null;
  }
  return {
    host: env.DB_HOST,
    port: parseInt(env.DB_PORT, 10),
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
  };
}

async function checkDatabase(): Promise<CheckResult> {
  const config = getDbConfig();
  if (!config) {
    return {
      name: 'PostgreSQL',
      required: 'configured',
      version: null,
      passed: false,
      message: 'Database config not found in apps/service/.env'
    };
  }
  const client = new Client({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    connectionTimeoutMillis: 5000,
  });
  try {
    await client.connect();
    const res = await client.query('SELECT version()');
    const version = res.rows[0]?.version?.split(' ')[0] + ' ' + res.rows[0]?.version?.split(' ')[1];
    await client.end();
    return {
      name: 'PostgreSQL',
      required: 'connected',
      version: version || 'connected',
      passed: true,
      message: `Connected: ${config.database}@${config.host}:${config.port}`
    };
  } catch (error) {
    await client.end().catch(() => {});
    return {
      name: 'PostgreSQL',
      required: 'connected',
      version: null,
      passed: false,
      message: `Connection failed: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

async function checkDatabaseTables(): Promise<CheckResult> {
  const config = getDbConfig();
  if (!config) {
    return {
      name: 'DB Tables',
      required: 'exist',
      version: null,
      passed: false,
      message: 'Database config not found'
    };
  }
  const client = new Client({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    connectionTimeoutMillis: 5000,
  });
  const requiredTables = ['users'];
  try {
    await client.connect();
    const res = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `);
    const existingTables = res.rows.map((r) => r.table_name);
    await client.end();
    const missing = requiredTables.filter((t) => !existingTables.includes(t));
    if (missing.length === 0) {
      return {
        name: 'DB Tables',
        required: 'exist',
        version: `${existingTables.length} tables`,
        passed: true,
        message: `All required tables exist: ${requiredTables.join(', ')}`
      };
    }
    return {
      name: 'DB Tables',
      required: 'exist',
      version: `${existingTables.length} tables`,
      passed: false,
      message: `Missing tables: ${missing.join(', ')}. Run migrations first.`
    };
  } catch (error) {
    await client.end().catch(() => {});
    return {
      name: 'DB Tables',
      required: 'exist',
      version: null,
      passed: false,
      message: `Check failed: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

function printResult(result: CheckResult): void {
  const icon = result.passed ? '✓' : '✗';
  const color = result.passed ? '\x1b[32m' : '\x1b[31m';
  const reset = '\x1b[0m';
  console.log(`${color}${icon}${reset} ${result.name}: ${result.message}`);
}

async function main() {
  const isWindows = platform() === 'win32';
  console.log(`\n🔍 Environment Check (${isWindows ? 'Windows' : 'Linux/macOS'})\n`);
  console.log('─'.repeat(50));

  const checks = [
    checkNodejs(),
    checkPnpm(),
    checkGit(),
    checkDocker(),
    checkDockerCompose(),
  ];

  const dbCheck = await checkDatabase();
  checks.push(dbCheck);

  const dbTablesCheck = await checkDatabaseTables();
  checks.push(dbTablesCheck);

  console.log('─'.repeat(50));
  checks.forEach(printResult);
  console.log('─'.repeat(50));

  const allPassed = checks.every((c) => c.passed);
  const criticalPassed = checks.slice(0, 3).every((c) => c.passed);

  console.log();

  if (allPassed) {
    console.log('\x1b[32m✅ All checks passed! Ready for development.\x1b[0m\n');
    process.exit(0);
  } else if (criticalPassed) {
    console.log('\x1b[33m⚠️  Core tools OK, but some optional tools are missing.\x1b[0m\n');
    console.log('You can still run the application but some features may not work.');
    process.exit(0);
  } else {
    console.log('\x1b[31m❌ Some required tools are missing. Please install them before continuing.\x1b[0m\n');
    process.exit(1);
  }
}

main();
