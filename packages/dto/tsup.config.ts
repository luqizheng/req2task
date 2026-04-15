import { defineConfig } from 'tsup'
import { baseTsupConfig } from '@req2task/dev-config/tsup'

export default defineConfig([
  {
    ...baseTsupConfig[0],
    entry: ['src/index.ts'],
  },
  {
    ...baseTsupConfig[1],
    entry: ['src/index.ts'],
  },
])
