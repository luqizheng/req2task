import { spawn, exec } from 'child_process';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SERVICE_PORT = 8080;

function checkPort(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const isWindows = process.platform === 'win32';
    const cmd = isWindows
      ? `netstat -ano | findstr ":${port} " | findstr LISTENING`
      : `lsof -i:${port} -sTCP:LISTEN`;

    exec(cmd, (_error: Error | null, stdout: string) => {
      resolve(stdout.trim().length > 0);
    });
  });
}

function getProcessOnPort(port: number): Promise<string | null> {
  return new Promise((resolve) => {
    const isWindows = process.platform === 'win32';
    let cmd: string;

    if (isWindows) {
      cmd = `netstat -ano | findstr ":${port}" | findstr LISTENING`;
    } else {
      cmd = `lsof -i:${port} -t`;
    }

    exec(cmd, (error: Error | null, stdout: string) => {
      if (error || !stdout) {
        resolve(null);
        return;
      }
      const lines = stdout.trim().split('\n');
      const pids = new Set<string>();
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        if (isWindows) {
          const lastPart = parts[parts.length - 1];
          if (lastPart && /^\d+$/.test(lastPart)) {
            pids.add(lastPart);
          }
        } else {
          if (/^\d+$/.test(line)) {
            pids.add(line);
          }
        }
      }
      resolve(pids.size > 0 ? Array.from(pids).join(', ') : null);
    });
  });
}

function killProcess(pid: string): Promise<boolean> {
  return new Promise((resolve) => {
    const isWindows = process.platform === 'win32';
    const cmd = isWindows ? `taskkill /PID ${pid} /F` : `kill -9 ${pid}`;

    exec(cmd, (error: Error | null) => {
      resolve(!error);
    });
  });
}

async function main(): Promise<void> {
  console.log(`Checking port ${SERVICE_PORT}...`);
  const isInUse = await checkPort(SERVICE_PORT);

  if (isInUse) {
    console.log(`Port ${SERVICE_PORT} is already in use.`);
    console.log('Attempting to kill the process...');

    const pid = await getProcessOnPort(SERVICE_PORT);
    if (pid) {
      console.log(`Process PIDs on port ${SERVICE_PORT}: ${pid}`);
      const pids = pid.split(',').map(p => p.trim());
      for (const p of pids) {
        const killed = await killProcess(p);
        if (killed) {
          console.log(`Process ${p} killed successfully.`);
        } else {
          console.log(`Failed to kill process ${p}.`);
        }
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.log(`Starting Gateway server on port ${SERVICE_PORT}...`);

  const rootDir = path.resolve(__dirname, '..');
  const gatewayDir = path.join(rootDir, 'apps', 'gateway');

  const nest = spawn('npx', ['nest', 'start', '--watch'], {
    cwd: gatewayDir,
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      PORT: String(SERVICE_PORT),
    },
  });

  nest.on('error', (err) => {
    console.error('Failed to start Gateway:', err);
    process.exit(1);
  });

  process.on('SIGINT', () => {
    nest.kill();
    process.exit(0);
  });
}

main();
