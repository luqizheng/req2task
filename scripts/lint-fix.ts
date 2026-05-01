import { execSync } from 'child_process'
import { existsSync } from 'fs'
import { resolve } from 'path'

interface Package {
  name: string
  path: string
  hasLint: boolean
  hasEslintConfig: boolean
  hasEslintrc: boolean
}

const packages: Package[] = [
  { name: '@req2task/web', path: 'apps/web', hasLint: true, hasEslintConfig: true, hasEslintrc: false },
  { name: '@req2task/service', path: 'apps/service', hasLint: true, hasEslintConfig: false, hasEslintrc: true },
  { name: '@req2task/core', path: 'packages/core', hasLint: true, hasEslintConfig: false, hasEslintrc: true },
  { name: '@req2task/dto', path: 'packages/dto', hasLint: true, hasEslintConfig: false, hasEslintrc: true },
  { name: '@req2task/ai-chat-service', path: 'apps/ai-chat-service', hasLint: true, hasEslintConfig: false, hasEslintrc: true },
  { name: '@req2task/file-conversion', path: 'apps/file-conversion', hasLint: true, hasEslintConfig: false, hasEslintrc: true },
]

interface LintResult {
  package: string
  success: boolean
  error?: string
  fixed?: number
}

function runLint(pkg: Package, fix: boolean = false): LintResult {
  const fullPath = resolve(process.cwd(), pkg.path)
  const fixFlag = fix ? '--fix' : ''

  try {
    if (pkg.hasEslintConfig) {
      execSync(`pnpm --filter ${pkg.name} run lint ${fixFlag}`, {
        cwd: process.cwd(),
        stdio: 'inherit',
        encoding: 'utf-8'
      })
    } else if (pkg.hasEslintrc) {
      execSync(`pnpm --filter ${pkg.name} run lint ${fixFlag}`, {
        cwd: process.cwd(),
        stdio: 'inherit',
        encoding: 'utf-8'
      })
    }

    return {
      package: pkg.name,
      success: true
    }
  } catch (error: any) {
    return {
      package: pkg.name,
      success: false,
      error: error.message || String(error)
    }
  }
}

function main() {
  const args = process.argv.slice(2)
  const shouldFix = args.includes('--fix')
  const shouldCheckOnly = args.includes('--check')

  console.log('\n🔍 Linting all packages...\n')

  const results: LintResult[] = []

  for (const pkg of packages) {
    const fullPath = resolve(process.cwd(), pkg.path)

    if (!existsSync(fullPath)) {
      console.log(`⚠️  ${pkg.name}: Directory not found, skipping`)
      continue
    }

    if (!pkg.hasLint) {
      console.log(`⚠️  ${pkg.name}: No lint script, skipping`)
      continue
    }

    console.log(`📦 Linting ${pkg.name}...`)

    const result = runLint(pkg, shouldFix)
    results.push(result)

    if (result.success) {
      console.log(`✅ ${pkg.name}: OK`)
    } else {
      console.log(`❌ ${pkg.name}: Failed`)
      if (result.error) {
        console.log(`   Error: ${result.error}`)
      }
    }
  }

  console.log('\n📊 Summary:')
  console.log(`   Total packages: ${packages.length}`)
  console.log(`   Successful: ${results.filter(r => r.success).length}`)
  console.log(`   Failed: ${results.filter(r => !r.success).length}`)

  if (shouldCheckOnly) {
    const failed = results.filter(r => !r.success)
    if (failed.length > 0) {
      console.log('\n❌ Lint check failed!')
      process.exit(1)
    }
  }

  console.log('\n✨ Done!\n')
}

main()
