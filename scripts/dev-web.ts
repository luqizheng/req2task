import * as net from 'net';
import { spawn, execSync } from 'child_process';
import * as path from 'path';

const WEB_PORT = 3000;

function getProcessInfoByPort(port: number): { pid: number | null; command: string } {
  try {
    const result = execSync(
      `powershell -Command "Get-NetTCPConnection -LocalPort ${port} -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess"`,
      { encoding: 'utf-8', windowsHide: true }
    ).trim();
    const pid = result ? parseInt(result, 10) : null;
    let command = '';
    if (pid) {
      try {
        command = execSync(
          `powershell -Command "(Get-Process -Id ${pid} -ErrorAction SilentlyContinue).Path"`,
          { encoding: 'utf-8', windowsHide: true }
        ).trim();
      } catch {
        command = '';
      }
    }
    return { pid, command };
  } catch {
    return { pid: null, command: '' };
  }
}

function killProcess(pid: number): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      execSync(`taskkill /PID ${pid} /F`, { windowsHide: true });
      resolve(true);
    } catch {
      resolve(false);
    }
  });
}

async function main() {
  const processInfo = getProcessInfoByPort(WEB_PORT);

  if (processInfo.pid) {
    console.log(`Port ${WEB_PORT} is in use by PID ${processInfo.pid} (${processInfo.command || 'unknown'}). Killing...`);
    const killed = await killProcess(processInfo.pid);
    if (!killed) {
      console.error(`Failed to kill process ${processInfo.pid}.`);
      process.exit(1);
    }
    console.log(`Process ${processInfo.pid} killed.`);
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log(`Starting web server on port ${WEB_PORT}...`);

  const rootDir = path.resolve(__dirname, '..');
  const webDir = path.join(rootDir, 'apps', 'web');

  const vite = spawn('npx', ['vite'], {
    cwd: webDir,
    stdio: 'inherit',
    shell: true,
  });

  vite.on('error', (err) => {
    console.error('Failed to start vite:', err);
    process.exit(1);
  });

  process.on('SIGINT', () => {
    vite.kill();
    process.exit(0);
  });
}

main();
