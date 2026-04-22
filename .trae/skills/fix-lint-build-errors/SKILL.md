---
name: "fix-lint-build-errors"
description: "Fixes lint and build errors in this monorepo project. Also removes unused interfaces, classes, and types. Invoke when user asks to fix lint/build errors or when project has compilation issues."
---

# Fix Lint and Build Errors

This skill fixes lint and build errors in the req2task monorepo project, including removing unused code definitions.

## Prerequisites

This project uses pnpm monorepo. Always run commands from the project root.

## Step 1: Run Lint to Identify Issues

```bash
pnpm lint
```

Common lint errors to fix:
- `no-unused-vars`: Remove unused variables
- `no-unused-imports`: Remove unused imports
- `no-console`: Replace console.log with structured logging
- `@typescript-eslint/no-unused-vars`: Remove unused variables/parameters

## Step 2: Run Build to Identify Compilation Errors

```bash
pnpm build
```

Common build errors to fix:
- TypeScript type errors
- Missing imports
- Circular dependencies
- Module resolution failures

## Step 3: Clean Unused Code

For unused exports (interfaces, types, classes), search and remove them:

1. Find unused interfaces/types/classes:
```bash
# Search for interface definitions
grep -r "export interface" --include="*.ts" --include="*.vue"
grep -r "export type" --include="*.ts" --include="*.vue"
grep -r "export class" --include="*.ts" --include="*.vue"
```

2. For each exported interface/type/class, verify it's used elsewhere before removing:
```bash
grep -r "InterfaceName" --include="*.ts" --include="*.vue" .
```

3. Common patterns for unused code:
- `// TODO:` commented code that's no longer used
- Duplicate type definitions
- Deprecated exports
- Code behind feature flags that are disabled

## Step 4: Verify Fixes

After fixing:
```bash
pnpm lint
pnpm build
```

Ensure both commands pass without errors before completing.

## Project-Specific Notes

- Frontend code: `apps/web/` (Vue 3 + Vite)
- Backend code: `apps/service/` (NestJS)
- Packages: `packages/` (shared code compiled with tsup)
- DTO definitions: `packages/dto/` (shared between frontend and backend)
