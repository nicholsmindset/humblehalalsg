# Humble Halal

Humble Halal is an informational publication for Muslims in Singapore: halal food guides, Muslim life stories, a Friday email, and free tools.

## Public experience

- `/` — editorial homepage with a featured guide, topic paths, recent articles, tools and newsletter.
- `/blog` — guides and stories.
- `/tools` — prayer times, Quran, duas, calculators and other free tools.
- `/mosques` and `/prayer-rooms` — practical location resources.
- `/is-halal` — curated brand information, with links to official verification.

The business directory, hawker finder, events marketplace, paid placements, owner dashboards and checkout flows are retired. Their public pages and transactional APIs return HTTP 410. Stripe webhooks and internal administration remain available for existing account wind-down; do not delete billing records or disable webhooks without checking outstanding subscriptions and obligations.

Older article copy is normalized in `lib/editorial-pivot.ts` so readers are not directed to retired listings. The source articles should still receive an editorial review as they are refreshed. The prior platform documentation is preserved in [docs/legacy-platform.md](docs/legacy-platform.md).

## Development

```bash
npm ci
npm run dev
npm run typecheck
npm run check:content
```

This is a Next.js 16 App Router project. Read the relevant guide in `node_modules/next/dist/docs/` before changing framework behavior, as required by `AGENTS.md`.

## Deployment

The production site is connected to the repository's `master` branch. Review and merge changes only when the public copy, billing wind-down and redirects are ready to go live.
