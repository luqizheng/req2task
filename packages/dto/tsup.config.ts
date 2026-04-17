import { defineConfig } from 'tsup'

export const baseTsupConfig = defineConfig([
  {
    entry: ['src/index.ts'],
    format: ['esm'],
    dts: true,
    splitting: false,
    clean: true,
    outDir: 'dist/esm',
  },
  {
    entry: ['src/index.ts'],
    format: ['cjs'],
    dts: true,
    splitting: false,
    clean: true,
    outDir: 'dist/cjs',
  },
])

export default baseTsupConfig
