import { execSync } from 'child_process'
import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

function getUnusedImportsFromLint(packageName: string): Map<string, { line: number; name: string }[]> {
  const unusedImportsMap = new Map<string, { line: number; name: string }[]>()
  
  const eslintDir = resolve(__dirname, '..', packageName)
  
  try {
    const result = execSync(
      `npx eslint src --format compact`,
      { 
        cwd: eslintDir, 
        encoding: 'utf-8',
        maxBuffer: 1024 * 1024 * 10,
        timeout: 120000 
      }
    )
    
    parseLintOutput(result, unusedImportsMap, eslintDir)
  } catch (error: any) {
    const output = error.stdout || error.stderr || ''
    parseLintOutput(output, unusedImportsMap, eslintDir)
  }
  
  return unusedImportsMap
}

function parseLintOutput(output: string, unusedImportsMap: Map<string, { line: number; name: string }[]>, baseDir: string) {
  const lines = output.split('\n')
  
  for (const line of lines) {
    if (line.includes('@typescript-eslint/no-unused-vars') && line.includes('is defined but never used')) {
      const fileMatch = line.match(/^(.+?):\s*line\s*(\d+)/)
      const nameMatch = line.match(/'([^']+)'/)
      
      if (fileMatch && nameMatch) {
        const filePath = fileMatch[1].replace(/\\/g, '/')
        const lineNum = parseInt(fileMatch[2])
        const importName = nameMatch[1]
        
        if (!unusedImportsMap.has(filePath)) {
          unusedImportsMap.set(filePath, [])
        }
        unusedImportsMap.get(filePath)!.push({ line: lineNum, name: importName })
      }
    }
  }
}

function removeUnusedImportsFromFile(filePath: string, unusedImports: { line: number; name: string }[]): boolean {
  try {
    let content = readFileSync(filePath, 'utf-8')
    let modified = false
    
    const unusedNames = unusedImports.map(u => u.name)
    
    for (const unusedImport of unusedNames) {
      const importPattern = new RegExp(
        `import\\s+{[^}]*\\b${unusedImport}\\b[^}]*}\\s+from\\s+['"][^'"]+['"]\\s*;?`,
        'g'
      )
      
      const match = content.match(importPattern)
      if (match) {
        for (const importStatement of match) {
          const namesMatch = importStatement.match(/import\s+{([^}]+)}\s+from\s+['"]([^'"]+)['"]/)
          if (namesMatch) {
            const allNames = namesMatch[1].split(',').map(n => n.trim())
            const modulePath = namesMatch[2]
            
            const remainingNames = allNames.filter(name => name !== unusedImport)
            
            if (remainingNames.length === 0) {
              content = content.replace(importStatement, '')
            } else {
              const newImport = `import { ${remainingNames.join(', ')} } from '${modulePath}';`
              content = content.replace(importStatement, newImport)
            }
            modified = true
          }
        }
      }
      
      const namedImportPattern = new RegExp(
        `import\\s+${unusedImport}\\s+from\\s+['"][^'"]+['"]\\s*;?`,
        'g'
      )
      
      if (content.match(namedImportPattern)) {
        content = content.replace(namedImportPattern, '')
        modified = true
      }
    }
    
    if (modified) {
      writeFileSync(filePath, content)
      return true
    }
    
    return false
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error)
    return false
  }
}

function main() {
  const args = process.argv.slice(2)
  const shouldFix = args.includes('--fix')
  const shouldDryRun = args.includes('--dry-run')
  
  let packages = ['apps/service']
  
  if (args.includes('--web')) {
    packages = ['apps/web']
  } else if (args.includes('--service')) {
    packages = ['apps/service']
  } else if (args.includes('--all')) {
    packages = [
      'apps/web',
      'apps/service',
      'packages/core',
      'packages/dto',
      'apps/ai-chat-service',
      'apps/file-conversion'
    ]
  } else if (args.includes('--packages')) {
    packages = ['packages/core', 'packages/dto']
  }
  
  console.log(`\n🔍 Scanning for unused imports...\n`)
  
  let totalUnused = 0
  
  for (const packageName of packages) {
    const unusedImportsMap = getUnusedImportsFromLint(packageName)
    
    if (unusedImportsMap.size === 0) {
      console.log(`✅ ${packageName}: No unused imports found!`)
      continue
    }
    
    console.log(`\n📦 ${packageName}:`)
    console.log(`   Found ${unusedImportsMap.size} files with unused imports`)
    
    let fixedCount = 0
    
    for (const [filePath, unusedImports] of unusedImportsMap) {
      const fileName = filePath.split('/').pop()
      console.log(`   📄 ${fileName}`)
      console.log(`      Path: ${filePath}`)
      console.log(`      Unused: ${unusedImports.map(u => `${u.name} (line ${u.line})`).join(', ')}`)
      
      if (shouldFix && !shouldDryRun) {
        const success = removeUnusedImportsFromFile(filePath, unusedImports)
        if (success) {
          console.log(`      ✅ Fixed!`)
          fixedCount++
        } else {
          console.log(`      ⚠️  Could not automatically fix`)
        }
      }
      
      totalUnused += unusedImports.length
    }
    
    if (shouldFix && fixedCount > 0) {
      console.log(`   ✨ Fixed ${fixedCount} files in ${packageName}`)
    }
  }
  
  if (shouldFix) {
    if (shouldDryRun) {
      console.log(`\n📊 Dry run complete. Found ${totalUnused} unused imports.\n`)
    } else {
      console.log(`\n✨ All fixes applied!\n`)
      console.log('💡 Run lint to verify.\n')
    }
  } else {
    console.log(`\n📊 Found ${totalUnused} unused imports total.`)
    console.log(`   Run with --fix to automatically remove them.\n`)
  }
}

main()
