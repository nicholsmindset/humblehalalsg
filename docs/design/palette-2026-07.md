# Palette — "Deep Teal & Saffron on Porcelain" (July 2026)

The 2026-07 revamp replaced the original emerald/gold/cream palette. Direction:
stay in the trust family (green-adjacent — culturally right for halal), but
clearly distinct from both the old site and the ChatGPT mock-ups (which were
near-identical emerald/gold).

## Applied palette (Candidate A — chosen)

| Token | Old | New | Note |
|---|---|---|---|
| `--emerald` | `#0F5C4A` | `#12525B` | deep teal — primary brand |
| `--emerald-700` | `#0C4A3C` | `#0D424A` | hover/pressed |
| `--emerald-600` | `#156A55` | `#17636D` | secondary surfaces |
| `--emerald-300` | `#6FA697` | `#6FA0A8` | tints |
| `--emerald-100` | `#DDEAE4` | `#DCE9EA` | wash |
| `--emerald-50` | `#EDF4F1` | `#EDF4F4` | wash |
| `--cream` | `#FAF7EF` | `#F8F6F1` | porcelain background (less yellow) |
| `--cream-200/300` | `#F3EEE0`/`#E9E2CF` | `#F0EDE4`/`#E4E0D3` | |
| `--gold` | `#D6A84F` | `#C97D3F` | saffron-terracotta accent |
| `--gold-700` | `#B98B36` | `#A96430` | text-safe accent (≈5:1 on porcelain) |
| `--gold-100/50` | `#F6ECD5`/`#FBF5E7` | `#F7E7D6`/`#FBF2E9` | apricot washes |
| shadow rgba | `15,92,74` | `18,82,91` | `--sh-emerald` |

Ink, lines, danger/warn and typography (Spectral + Hanken Grotesk) unchanged.
Token *names* unchanged (`--emerald` now holds teal) so no selector churn.

Swap surface: `styles/*.css` tokens + every hardcoded brand hex in
`app/*/opengraph-image.tsx`, `app/icon.svg`, `app/apple-icon.tsx`,
`app/manifest.ts`, `app/layout.tsx` (theme-color), admin dashboard charts and
screen components — one global case-insensitive hex map (22 files).

## Alternates considered (easy to swap — same hex-map approach)

**B — "Midnight Olive & Clay":** olive-forest `#3B4A2F` primary, clay `#B65C38`
accent, bone `#F7F5EE` bg. Earthier/heritage; weaker contrast headroom in tints.

**C — "Indigo & Brass":** deep indigo `#27336B`, brass `#B98A3C`, chalk
`#F7F6F2`. Most distinctive, but abandons the green trust-semantics of the
halal category — rejected for brand fit.

To try an alternate: rerun the hex-map swap (see git history of this commit)
with the new values — everything cascades.
