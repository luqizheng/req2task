import * as net from 'net';
import { spawn } from 'child_process';
import * as path from 'path';
import * as http from 'http';

const SERVICE_PORT = 4000;
const HEALTH_ENDPOINT = `http://localhost:${SERVICE_PORT}/api/health`;

interface HealthResponse {
  status: string;
  service: string;
  timestamp: string;
}

function checkPort(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const { exec } = require('child_process');
    const isWindows = process.platform === 'win32';
    const cmd = isWindows
      ? `netstat -ano | findstr ":${port} " | findstr LISTENING`
      : `lsof -i:${port} -sTCP:LISTEN`;

    exec(cmd, (_error: Error | null, stdout: string) => {
      resolve(stdout.trim().length > 0);
    });
  });
}

function checkHealthEndpoint(): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.get(HEALTH_ENDPOINT, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const json: HealthResponse = JSON.parse(data);
            if (json.status === 'ok' && json.service === 'req2task-service') {
              resolve(true);
              return;
            }
          } catch {
            resolve(false);
            return;
          }
        }
        resolve(false);
      });
    });
    req.on('error', () => {
      resolve(false);
    });
    req.setTimeout(3000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

function getProcessOnPort(port: number): Promise<string | null> {
  return new Promise((resolve) => {
    const { exec } = require('child_process');
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

async function main() {
  console.log(`Checking port ${SERVICE_PORT}...`);
  const isInUse = await checkPort(SERVICE_PORT);

  if (isInUse) {
    console.log(`Port ${SERVICE_PORT} is already in use.`);
    console.log('Verifying if it is our service via healthcheck...');

    const isHealthy = await checkHealthEndpoint();

    if (isHealthy) {
      console.log(`Healthcheck passed. Our service is running on port ${SERVICE_PORT}.`);
      return;
    }

    console.log(`\n⚠️  WARNING: Port ${SERVICE_PORT} is occupied by another process!`);
    console.log('The healthcheck failed, meaning it is not our req2task service.\n');

    const pid = await getProcessOnPort(SERVICE_PORT);
    if (pid) {
      console.log(`Process PIDs on port ${SERVICE_PORT}: ${pid}`);
      console.log('\nPlease kill the process and restart:');
      if (process.platform === 'win32') {
        console.log(`  taskkill /PID ${pid} /F`);
      } else {
        console.log(`  kill -9 ${pid}`);
      }
    }
    process.exit(1);
  }

  console.log(`Port ${SERVICE_PORT} is available. Starting service server...`);

  const rootDir = path.resolve(__dirname, '..');
  const serviceDir = path.join(rootDir, 'apps', 'service');

  const nest = spawn('npx', ['nest', 'start', '--watch'], {
    cwd: serviceDir,
    stdio: 'inherit',
    shell: true,
  });

  nest.on('error', (err) => {
    console.error('Failed to start nest:', err);
    process.exit(1);
  });

  process.on('SIGINT', () => {
    nest.kill();
    process.exit(0);
  });
}

main();
