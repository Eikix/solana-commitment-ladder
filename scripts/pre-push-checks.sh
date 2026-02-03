#!/usr/bin/env bash
set -euo pipefail

echo "[pre-push-checks] Running heavier checks..."

if [[ -f Anchor.toml ]]; then
  if command -v anchor >/dev/null 2>&1; then
    echo "[pre-push-checks] Anchor: anchor test"
    anchor test
  else
    echo "[pre-push-checks] Anchor.toml found but anchor not installed; skipping"
  fi
fi

if [[ -f Cargo.toml ]]; then
  if command -v cargo >/dev/null 2>&1; then
    echo "[pre-push-checks] Rust: fmt/clippy/test"
    cargo fmt --all -- --check
    cargo clippy --all-targets --all-features -- -D warnings
    cargo test --all --all-features
  else
    echo "[pre-push-checks] Cargo.toml found but cargo not installed; skipping"
  fi
fi

if [[ -f package.json ]]; then
  if command -v node >/dev/null 2>&1 && command -v npm >/dev/null 2>&1; then
    if node -e "process.exit(require('./package.json')?.scripts?.test ? 0 : 1)"; then
      echo "[pre-push-checks] Node: npm test"
      npm test
    else
      echo "[pre-push-checks] Node: no package.json scripts.test; skipping"
    fi
  else
    echo "[pre-push-checks] package.json found but node/npm not installed; skipping"
  fi
fi

echo "[pre-push-checks] Done"
