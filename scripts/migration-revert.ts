#!/usr/bin/env node

import { execSync } from 'child_process';

execSync(
  `pnpm --filter @req2task/service migration:revert`,
  { stdio: 'inherit' }
);