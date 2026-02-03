import { execSync } from 'node:child_process'
import { existsSync } from 'node:fs'

if (!existsSync('.git')) {
  process.exit(0)
}

try {
  execSync('npx --no-install lefthook install', { stdio: 'inherit' })
} catch {
  // Don't fail installs (zip downloads, restricted envs, etc.)
  process.exit(0)
}
