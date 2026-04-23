import { execSync } from 'child_process';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REGISTRY = 'zhcoder-docker-registry.com:8000/coder';
const IMAGE_NAME = 'gateway';
const IMAGE_TAG = process.argv[2] || 'latest';

const imageFullName = `${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}`;

function run(command: string, cwd?: string): void {
  console.log(`[EXEC] ${command}`);
  execSync(command, {
    stdio: 'inherit',
    cwd: cwd || path.join(__dirname, '..'),
  });
}

function main(): void {
  const workspaceRoot = path.join(__dirname, '..');
  const appDir = path.join(workspaceRoot, 'apps', 'gateway');

  console.log('🐳 Building Docker image...');

  run(`docker buildx build -t ${REGISTRY}/req2task-gateway:1.0 --platform linux/amd64 --push -f ${appDir}/Dockerfile .`);

  console.log(`✅ Done! Image: ${REGISTRY}/req2task-gateway:1.0`);
}

main();
