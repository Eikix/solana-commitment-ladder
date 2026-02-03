#!/usr/bin/env bash
set -euo pipefail

echo "[pre-commit-checks] Running fast checks..."

if [[ -f Cargo.toml ]]; then
  if command -v cargo >/dev/null 2>&1; then
    echo "[pre-commit-checks] Rust: cargo fmt (check)"
    cargo fmt --all -- --check
  else
    echo "[pre-commit-checks] Rust: Cargo.toml found but cargo not installed; skipping"
  fi
fi

if [[ -f package.json ]]; then
  if command -v node >/dev/null 2>&1 && command -v npm >/dev/null 2>&1; then
    if node -e "process.exit(require('./package.json')?.scripts?.lint ? 0 : 1)"; then
      echo "[pre-commit-checks] Node: npm run lint"
      npm run -s lint
    else
      echo "[pre-commit-checks] Node: no package.json scripts.lint; skipping"
    fi

    if node -e "process.exit(require('./package.json')?.scripts?.['format:check'] ? 0 : 1)"; then
      echo "[pre-commit-checks] Node: npm run format:check"
      npm run -s format:check
    else
      echo "[pre-commit-checks] Node: no package.json scripts.format:check; skipping"
    fi

    if node -e "process.exit(require('./package.json')?.scripts?.typecheck ? 0 : 1)"; then
      echo "[pre-commit-checks] Node: npm run typecheck"
      npm run -s typecheck
    else
      echo "[pre-commit-checks] Node: no package.json scripts.typecheck; skipping"
    fi
  else
    echo "[pre-commit-checks] Node: package.json found but node/npm not installed; skipping"
  fi
fi

echo "[pre-commit-checks] Done"
