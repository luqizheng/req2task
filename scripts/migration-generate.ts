#!/usr/bin/env node

import { execSync } from 'child_process';
import { argv } from 'process';

const migrationName = argv[2];

if (!migrationName) {
  console.error('请提供 migration 名称');
  process.exit(1);
}

execSync(
  `pnpm --filter @req2task/service migration:generate ./src/migrations/${migrationName}`,
  { stdio: 'inherit' }
);