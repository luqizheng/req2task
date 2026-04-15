#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { platform, release } from 'os';

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

function printResult(result: CheckResult): void {
  const icon = result.passed ? '✓' : '✗';
  const color = result.passed ? '\x1b[32m' : '\x1b[31m';
  const reset = '\x1b[0m';
  console.log(`${color}${icon}${reset} ${result.name}: ${result.message}`);
}

function main() {
  const isWindows = platform() === 'win32';
  console.log(`\n🔍 Environment Check (${isWindows ? 'Windows' : 'Linux/macOS'})\n`);
  console.log('─'.repeat(50));

  const checks = [
    checkNodejs(),
    checkPnpm(),
    checkGit(),
    checkDocker(),
    checkDockerCompose()
  ];

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
