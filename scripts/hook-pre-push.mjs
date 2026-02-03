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

console.log('[pre-push] running heavier checks...')

if (typeof scripts?.test !== 'string') {
  console.log('[pre-push] skip: no scripts.test')
  console.log('[pre-push] done')
  process.exit(0)
}

console.log('[pre-push] npm test')
runNpm(['test'])
console.log('[pre-push] done')
