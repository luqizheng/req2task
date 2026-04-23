import { spawn } from 'child_process';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function main(): void {
  const workspaceRoot = path.join(__dirname, '..');
  const gatewayDir = path.join(workspaceRoot, 'apps', 'api-gateway');

  console.log('🚀 Starting Rust API Gateway...');
  console.log('📝 Gateway directory:', gatewayDir);
  
  const cargo = spawn('cargo', ['run', '--', 'start', '--config', 'config.yaml'], {
    cwd: gatewayDir,
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      RUST_LOG: 'info',
    },
  });

  cargo.on('error', (err) => {
    console.error('❌ Failed to start API Gateway:', err);
    process.exit(1);
  });

  cargo.on('close', (code) => {
    if (code !== 0) {
      console.error(`❌ API Gateway exited with code ${code}`);
    }
    process.exit(code || 0);
  });

  process.on('SIGINT', () => {
    console.log('\n🛑 Stopping API Gateway...');
    cargo.kill('SIGINT');
  });
}

main();
