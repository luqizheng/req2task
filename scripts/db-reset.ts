#!/usr/bin/env node

import { execSync } from 'child_process';
import * as readline from 'readline';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      resolve(answer.trim());
    });
  });
}

function deleteMigrationFiles(dirPath: string): void {
  if (fs.existsSync(dirPath)) {
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      if (fs.statSync(filePath).isFile()) {
        fs.unlinkSync(filePath);
        console.log(`  删除: ${file}`);
      }
    }
  }
}

async function main() {
  console.log('\n=== 数据库重置工具 ===\n');

  console.log('--- 步骤 1: 执行 migration:drop ---\n');

  console.log('删除 service 迁移...');
  try {
    execSync(
      `pnpm --filter @req2task/service migration:drop`,
      { stdio: 'inherit' }
    );
  } catch (error) {
    console.log('  service 迁移表删除完成（或无迁移）');
  }

  console.log('\n删除 ai-chat-service 迁移...');
  try {
    execSync(
      `pnpm --filter @req2task/ai-chat-service migration:drop`,
      { stdio: 'inherit' }
    );
  } catch (error) {
    console.log('  ai-chat-service 迁移表删除完成（或无迁移）');
  }

  console.log('\n--- 步骤 2: 删除迁移文件 ---\n');

  const deleteAnswer = await question('是否删除所有迁移文件? (y/n): ');

  if (deleteAnswer.toLowerCase() === 'y') {
    console.log('\n删除迁移文件...\n');

    const serviceMigrationsDir = path.join(__dirname, '../apps/service/src/migrations');
    const aiChatMigrationsDir = path.join(__dirname, '../apps/ai-chat-service/migrations');

    console.log('删除 service 迁移文件:');
    deleteMigrationFiles(serviceMigrationsDir);

    console.log('\n删除 ai-chat-service 迁移文件:');
    deleteMigrationFiles(aiChatMigrationsDir);

    console.log('\n--- 步骤 3: 重新生成迁移文件 ---\n');

    rl.close();

    execSync(
      `node "${path.join(__dirname, 'migration-generate.ts')}"`,
      { stdio: 'inherit' }
    );
  } else {
    console.log('跳过删除迁移文件\n');
    rl.close();
  }

  console.log('\n--- 步骤 4: 执行 migration:run ---\n');

  execSync(
    `pnpm --filter @req2task/service migration:run`,
    { stdio: 'inherit' }
  );

  execSync(
    `pnpm --filter @req2task/ai-chat-service migration:run`,
    { stdio: 'inherit' }
  );

  console.log('\n=== 数据库重置完成 ===\n');
}

main();
