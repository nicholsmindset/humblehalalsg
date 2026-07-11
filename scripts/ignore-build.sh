#!/usr/bin/env bash
# Vercel "Ignored Build Step" gate. Vercel semantics: exit 0 = SKIP the build,
# exit 1 = PROCEED with the build. Wired up via vercel.json's "ignoreCommand".
#
# Skips a build only when every changed file is docs/non-source (README,
# markdown, docs/). Anything else — or anything we can't confidently
# determine — falls through to "build" (exit 1). Never fail closed: an
# unbuilt production/preview because this script guessed wrong is a much
# worse outcome than an occasional unnecessary build.
set -u

PREV_SHA="${VERCEL_GIT_PREVIOUS_SHA:-}"

if [ -z "$PREV_SHA" ]; then
  # No previous deployment SHA (first deploy on this branch, or running
  # outside Vercel) — can't diff safely, so build.
  echo "ignore-build: no VERCEL_GIT_PREVIOUS_SHA, building"
  exit 1
fi

CHANGED_FILES="$(git diff --name-only "$PREV_SHA" HEAD 2>/dev/null)"
DIFF_STATUS=$?

if [ "$DIFF_STATUS" -ne 0 ] || [ -z "$CHANGED_FILES" ]; then
  echo "ignore-build: could not determine diff, building"
  exit 1
fi

# Any line NOT matching a docs/non-source pattern means "build".
NON_DOCS="$(echo "$CHANGED_FILES" | grep -Ev '\.md$|^docs/|^README|^CHANGELOG|^LICENSE' || true)"

if [ -n "$NON_DOCS" ]; then
  echo "ignore-build: source changes detected, building:"
  echo "$NON_DOCS"
  exit 1
fi

echo "ignore-build: docs-only change, skipping build:"
echo "$CHANGED_FILES"
exit 0
