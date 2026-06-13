# Local Claude scheduled jobs (C2 / C4 / C5)

The MCP/judgment-heavy jobs run **locally on your Mac** (not GitHub Actions) so
they can use the configured MCP servers — **Ahrefs** (connected), Firecrawl,
Brave, Perplexity — which aren't wired into CI.

| Job | Prompt | Cadence | What it does |
|-----|--------|---------|--------------|
| **C2 cross-check** | `prompts/data-cross-check.md` | weekly | Verify top listings vs website/Maps/HalalSG → report + Issues |
| **C4 review-triage** | `prompts/review-triage.md` | daily | Classify pending reviews (APPROVE-CANDIDATE/FLAG-*/NEEDS-HUMAN) |
| **C5 seo-scan** | `prompts/seo-scan.md` | monthly | Ahrefs+GSC striking-distance, gaps, decaying guides, AI-citation |

**Golden rule (all three): flag only.** They write `reports/*.md` and may open
GitHub Issues, but never edit listings, halal status, reviews, or publish.
A human acts on the report.

## One-time setup

1. **Claude Code CLI** installed and logged in, with this repo's MCP servers
   configured (Ahrefs etc. already are). `gh` CLI authenticated for Issues.
2. **Env** — put secrets in `.env.local` (gitignored) or `~/.env`:
   ```
   SITE_URL=https://humblehalal.com
   HH_ADMIN_TOKEN=…        # for C4's read-only admin reviews endpoint
   # ANTHROPIC_API_KEY only needed if not using your logged-in CLI session
   ```
3. **Try a job by hand first:**
   ```bash
   scripts/claude-jobs/run-job.sh seo-scan
   ```
   Confirm it writes `reports/seo-scan-<date>.md` and makes no edits.

## Schedule with launchd

The plists live in `launchd/` with a `REPO_PATH` placeholder. Install:

```bash
REPO="/Users/robertnichols/Desktop/AI Projects/humblehalalsg/humblehalalsg"
for f in scripts/claude-jobs/launchd/*.plist; do
  out="$HOME/Library/LaunchAgents/$(basename "$f")"
  sed "s#REPO_PATH#$REPO#g" "$f" > "$out"
  launchctl unload "$out" 2>/dev/null || true
  launchctl load "$out"
done
launchctl list | grep humblehalal   # verify
```

Remove a job: `launchctl unload ~/Library/LaunchAgents/com.humblehalal.<job>.plist`.

Logs land in `logs/` (per-run `<job>-<date>.log` + launchd `.out/.err`).
Both `reports/` and `logs/` are gitignored.

## Why split (CI vs local)?

- **GitHub Actions** (`.github/workflows/claude-*.yml`): blog drafting + content
  QA — deterministic, no MCP, produce PRs/comments. Enable by adding
  `ANTHROPIC_API_KEY` secret and setting repo variable `CLAUDE_JOBS_ENABLED=1`.
- **Local launchd** (here): need the Ahrefs/Firecrawl/Brave MCPs and live admin
  endpoints — kept on your machine where they're configured.
