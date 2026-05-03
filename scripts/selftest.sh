#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DOC_ROOT="${CONTE_BASE_DOC_ROOT:-/Users/conteman/Projects/conte-base/conte-base-doc}"
failures=0

fail() {
  echo "[FAIL] $1"
  failures=$((failures + 1))
}

ok() {
  echo "[ OK ] $1"
}

require_file() {
  local file="$1"
  if [[ -f "$ROOT/$file" ]]; then ok "file: $file"; else fail "missing file: $file"; fi
}

required_files=(
  AGENTS.md
  README.md
  package.json
  pnpm-workspace.yaml
  scripts/selftest.sh
  .github/workflows/selftest.yml
  apps/admin/package.json
  apps/admin/.env.example
  apps/admin/index.html
  apps/admin/tsconfig.json
  apps/admin/vite.config.mts
  apps/admin/src/main.ts
  apps/admin/src/app.vue
  apps/admin/src/bootstrap.ts
  apps/admin/src/preferences.ts
  apps/admin/src/app-config.ts
  apps/admin/src/router/index.ts
  apps/admin/src/router/access.ts
  apps/admin/src/router/guard.ts
  apps/admin/src/store/auth.ts
  apps/admin/src/locales/index.ts
  apps/admin/src/api/core/auth.ts
  apps/admin/src/api/core/menu.ts
  apps/admin/src/api/core/user.ts
  apps/admin/src/layouts/basic.vue
  apps/admin/src/layouts/auth.vue
  apps/admin/src/views/_core/authentication/login.vue
  apps/admin/src/views/_core/fallback/coming-soon.vue
)

for file in "${required_files[@]}"; do require_file "$file"; done

if command -v pnpm >/dev/null 2>&1; then
  (cd "$ROOT" && pnpm install --frozen-lockfile)
  ok "pnpm install --frozen-lockfile"
  (cd "$ROOT" && pnpm --dir apps/admin typecheck)
  ok "pnpm --dir apps/admin typecheck"
  (cd "$ROOT" && pnpm --dir apps/admin build)
  ok "pnpm --dir apps/admin build"
else
  fail "pnpm command not found"
fi

if [[ "${GITHUB_ACTIONS:-}" == "true" ]]; then
  ok "skip doc control plane selftest in GitHub Actions"
else
  if [[ -x "$DOC_ROOT/scripts/selftest.sh" ]]; then
    "$DOC_ROOT/scripts/selftest.sh"
  else
    fail "missing executable doc selftest: $DOC_ROOT/scripts/selftest.sh"
  fi
fi

if [[ $failures -gt 0 ]]; then
  echo "admin web selftest failed: $failures issue(s)"
  exit 1
fi

echo "admin web selftest passed"
