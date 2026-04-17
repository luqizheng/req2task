import * as net from 'net';
import { spawn } from 'child_process';
import * as path from 'path';

const WEB_PORT = 3000;

function checkPort(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        resolve(true);
      } else {
        resolve(false);
      }
    });
    server.once('listening', () => {
      server.close();
      resolve(false);
    });
    server.listen(port, '0.0.0.0');
  });
}

async function main() {
  console.log(`Checking port ${WEB_PORT}...`);
  const isInUse = await checkPort(WEB_PORT);

  if (isInUse) {
    console.log(`Port ${WEB_PORT} is already in use. Skipping web server start.`);
    return;
  }

  console.log(`Port ${WEB_PORT} is available. Starting web server...`);

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
