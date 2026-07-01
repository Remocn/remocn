# changelog

**Family:** B. Release & Updates · **Default duration:** ~9s (270f @30fps, scales with item count N) · **Format:** 16:9 · **Vibe:** clean

A regular-release recap: show the version number and a human-readable list of changes (Added / Fixed /
Changed), close on a footer with a link and date. Calm and legible — the list must read, not dazzle.
Read `../anatomy.md` first; pick components from `../components/index.md`.

## Beats

A short 3-beat specialization of the anatomy (Positioning → Features → CTA). Duration scales with N:
`total ≈ 60 (badge) + clamp(N*24, 96, 200) (list) + 70 (footer) − 2*12 overlap`. N=4 → ~270f.

| Frames (N=4) | Beat | What happens |
|---|---|---|
| 0–60 | **Version badge** | version chip slides into the top-left, date right; "What's new" builds via `tracking-in` |
| 60–160 | **Change list** | N rows, each a category tag (Added/Fixed/Changed) + text; staggered in, ~9f apart |
| 160–270 | **Footer / CTA** | small version chip, link/CTA fades in, optional release-progress indicator |

Transitions: badge→list `shared-axis-y` (spring, 12f); list→footer `fade-through` (linear, 12f).

## Beat → slots

| Beat | Catalog components | New component needed |
|---|---|---|
| Version badge | `tracking-in` (title), `dynamic-grid` (static low-opacity bg) | **`version-badge`** — version chip + date (build per `../anatomy.md` §1) |
| Change list | `staggered-fade-up` (rows), `spring-scale-in` (tags) | **`change-list`** — renders `{tag,text}[]` with a tag→color map (Added=green, Fixed=amber, Changed=blue) and auto-stagger + "+M more" truncation; **`category-tag`** — fixed-width monospace category chip (reused in patch-notes) |
| Footer / CTA | `soft-blur-in` (link), `micro-scale-fade` (chip), `progress-steps` (optional release indicator) | a small footer/CTA scene if none fits |

The change-list / version-badge / category-tag don't exist in the catalog yet — they're reusable
across release archetypes, so build them as lightweight components (anatomy §1, "build new"), not one-offs.

## Content contract (infer → ask → placeholder)

| Field | Required | Notes |
|---|---|---|
| `version` | yes | infer from `package.json` / latest git tag |
| `date` | yes | release date |
| `changes[]` | yes | `{ tag: "Added"\|"Fixed"\|"Changed", text }` — infer from `CHANGELOG.md` / merged PR titles |
| `link` | no | full-notes URL / CTA |
| `brand` | no | `{ accent, background }` → one accent on a neutral canvas |

`[N]` archetype: the list scene stretches linearly with the number of changes; cap visible rows and
fold the rest into "+M more" rather than shrinking type.

## Notes

- **Background can move — keep it restrained.** A slow, muted shader (`shader-mesh-gradient`,
  `shader-neuro-noise`, `shader-perlin-noise`) at low `speed`, a low-opacity `dynamic-grid` (≈0.06),
  or a solid theme fill all work. The list is the focus — if the backdrop moves, keep it muted and
  gentle so it never competes with the reading text.
- One accent only; the tag colors (green/amber/blue) are semantic, not decoration — keep them muted.
- Real change text from the repo, never `Scene A` / lorem. All copy English.
- This is a list archetype — guard against the slop trap of enumerating forever: cap rows, keep it ~9s.
