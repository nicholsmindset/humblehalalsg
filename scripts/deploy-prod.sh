#!/usr/bin/env bash
#
# Deploy the merged `master` to Vercel production (www.humblehalal.com).
#
# WHY THIS EXISTS: Vercel's Git integration on this project only creates Preview
# builds — production is NOT auto-deployed on a push/merge to master. Promoting
# requires an explicit `vercel --prod`. (See memory: prod-deploy-coordination.)
#
# WHAT IT DOES: builds the EXACT current `origin/master` in a throwaway git
# worktree, so it deploys the merged code even when your working checkout is on
# another (possibly dirty) feature branch. Never deploys your local edits.
#
# Usage:  npm run deploy:prod      (or: bash scripts/deploy-prod.sh)
# Requires: the Vercel CLI, logged in, with the project linked (.vercel/project.json).
#
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

if [ ! -f ".vercel/project.json" ]; then
  echo "✖ .vercel/project.json not found. Link the project first:  vercel link" >&2
  exit 1
fi
if ! command -v vercel >/dev/null 2>&1; then
  echo "✖ Vercel CLI not found. Install it:  npm i -g vercel" >&2
  exit 1
fi

WT="${TMPDIR:-/tmp}/hh-deploy-master-$$"
cleanup() {
  git worktree remove "$WT" --force >/dev/null 2>&1 || true
  git worktree prune >/dev/null 2>&1 || true
}
trap cleanup EXIT

echo "→ Fetching origin/master…"
git fetch origin --quiet

REF="$(git rev-parse --short origin/master)"
echo "→ Checking out clean origin/master ($REF) in a throwaway worktree…"
git worktree add "$WT" origin/master --detach --quiet
cp -R .vercel "$WT/.vercel"   # carry the gitignored Vercel project link into the worktree

echo "→ Deploying to production (builds remotely on Vercel)…"
( cd "$WT" && vercel --prod --yes )

echo ""
echo "✓ Deployed origin/master ($REF) to production."
echo "  Verify:  curl -s https://www.humblehalal.com/travel | grep -c 'Plan by purpose'"
