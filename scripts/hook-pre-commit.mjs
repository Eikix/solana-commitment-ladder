import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

function readPackageJson() {
  if (!existsSync('package.json')) return null
  try {
    return JSON.parse(readFileSync('package.json', 'utf8'))
  } catch {
    return null
  }
}

function npmBin() {
  return process.platform === 'win32' ? 'npm.cmd' : 'npm'
}

function runNpm(args) {
  const result = spawnSync(npmBin(), args, { stdio: 'inherit' })
  process.exitCode = result.status ?? 1
  if (result.status !== 0) process.exit(process.exitCode)
}

const pkg = readPackageJson()
const scripts = pkg?.scripts ?? {}

console.log('[pre-commit] running fast checks...')

for (const scriptName of ['lint', 'format:check', 'typecheck']) {
  if (typeof scripts?.[scriptName] !== 'string') {
    console.log(`[pre-commit] skip: no scripts.${scriptName}`)
    continue
  }
  console.log(`[pre-commit] npm run ${scriptName}`)
  runNpm(['run', '-s', scriptName])
}

console.log('[pre-commit] done')
