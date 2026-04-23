#!/usr/bin/env node

import { execSync } from 'child_process';
import * as readline from 'readline';

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

async function main() {
  console.log('\n=== 数据库迁移生成工具 ===\n');

  const serviceAnswer = await question('1. 是否生成 service 迁移? (y/n): ');
  let serviceMigrationName = '';
  if (serviceAnswer.toLowerCase() === 'y') {
    serviceMigrationName = await question('   请输入 service 迁移名称 (直接回车跳过): ');
  }

  const aiChatAnswer = await question('2. 是否生成 ai-chat-service 迁移? (y/n): ');
  let aiChatMigrationName = '';
  if (aiChatAnswer.toLowerCase() === 'y') {
    aiChatMigrationName = await question('   请输入 ai-chat-service 迁移名称 (直接回车跳过): ');
  }

  rl.close();

  console.log('\n--- 开始执行 ---\n');

  if (serviceAnswer.toLowerCase() === 'y' && serviceMigrationName) {
    console.log(`生成 service 迁移: ${serviceMigrationName}`);
    execSync(
      `pnpm --filter @req2task/service migration:generate ./src/migrations/${serviceMigrationName}`,
      { stdio: 'inherit' }
    );
  } else {
    console.log('跳过 service 迁移');
  }

  if (aiChatAnswer.toLowerCase() === 'y' && aiChatMigrationName) {
    console.log(`生成 ai-chat-service 迁移: ${aiChatMigrationName}`);
    execSync(
      `pnpm --filter @req2task/ai-chat-service migration:generate ./migrations/${aiChatMigrationName}`,
      { stdio: 'inherit' }
    );
  } else {
    console.log('跳过 ai-chat-service 迁移');
  }

  console.log('\n--- 执行完成 ---\n');
}

main();