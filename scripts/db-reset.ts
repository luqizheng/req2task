#!/usr/bin/env node

import { execSync } from 'child_process';

execSync(
  `pnpm --filter @req2task/service migration:drop`,
  { stdio: 'inherit' }
);

execSync(
  `pnpm --filter @req2task/service migration:run`,
  { stdio: 'inherit' }
);
