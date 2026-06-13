#!/usr/bin/env bash
# Generic runner for the local (Mac/launchd) Claude jobs — C2/C4/C5.
# These run from the repo so the configured MCP servers (Ahrefs, Firecrawl,
# Brave, Perplexity) are available. Golden rule: every job is FLAG-ONLY — it
# writes a report and may open GitHub Issues, but never edits listings, halal
# status, reviews, or publishes content.
#
# Usage: scripts/claude-jobs/run-job.sh <prompt-name>
#   e.g. scripts/claude-jobs/run-job.sh data-cross-check
set -euo pipefail

JOB="${1:?usage: run-job.sh <prompt-name>}"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT"

PROMPT="scripts/claude-jobs/prompts/${JOB}.md"
[ -f "$PROMPT" ] || { echo "no prompt: $PROMPT" >&2; exit 1; }

# Load local env (SITE_URL, HH_ADMIN_TOKEN, ANTHROPIC_API_KEY, etc.).
[ -f .env.local ] && set -a && . ./.env.local && set +a
[ -f "$HOME/.env" ] && set -a && . "$HOME/.env" && set +a

mkdir -p reports logs
STAMP="$(date +%Y-%m-%d)"
LOG="logs/${JOB}-${STAMP}.log"

echo "[$(date)] running ${JOB}" | tee -a "$LOG"
# Read-only by default; jobs that write a report/Issue are allowed Write + gh.
claude -p "$(cat "$PROMPT")" \
  --allowedTools "Read" "Write" "Bash(gh issue create:*)" "Bash(gh pr comment:*)" \
  --max-turns 60 2>&1 | tee -a "$LOG"
echo "[$(date)] done ${JOB}" | tee -a "$LOG"
