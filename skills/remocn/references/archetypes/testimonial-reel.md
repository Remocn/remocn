# testimonial-reel

**Family:** C. Growth & Social Proof · **Default duration:** ~14s (430f @30fps for N=3, scales with quote count) · **Format:** 16:9 · **Vibe:** clean

Cycle real customer quotes one at a time — each card springs in, holds while the quote text plays word-by-word, then fades through to the next. Close on an aggregate proof number ("Join 12,000+ people who found their flow") so the social proof lands on data, not sentiment alone. One accent color throughout; background is a `spotlight-card` soft light on a solid dark canvas.
Read `../anatomy.md` first; pick components from `../components/index.md`.

## Beats

Frame math: `total = 60 (intro) + N×90 (quote scenes, 15f fade-through overlap each) + 10 (last-quote hold) + 90 (aggregate close)`. N=3 → 430f (~14s). Cap at N=5 (~600f, ~20s) and fold any extra quotes into "+M more" on the aggregate tagline rather than extending runtime.

| Frames (N=3) | Beat | What happens |
|---|---|---|
| 0–60 | **Intro** | Section title "What teams say" builds via `tracking-in`; thin horizontal divider enters via `mask-reveal-up` (left → right, 20f) |
| 60–165 | **Quote 1** | `testimonial-card` springs up (translateY 40→0, `spring({damping:18,mass:0.9})`); quote text arrives via `per-word-crossfade` (4f/word stagger); avatar + author/role enter via `staggered-fade-up` (2 elements, 6f stagger); 2 peek cards behind at scale 0.94 / opacity 0.5 |
| 150–255 | **Quote 2** | `fade-through` swap (15f overlap); author-line enters via `short-slide-right`; peek stack shifts depth |
| 240–355 | **Quote N** | Last quote holds +10f longer; peek cards resolve to full opacity as the stack empties; `blur-out-up` exits the card stack on the way out |
| 345–435 | **Aggregate close** | `spring-scale-in` enters the metric block; `rolling-number` counts to the aggregate figure; tagline "Join X+ [phrase]" arrives via `staggered-fade-up`; optional `x-followers-overview` or `github-stars` anchors the number in a recognizable social surface |

Transitions: `fade-through` (`linearTiming(15)`) between each quote scene; intro → Quote 1 via `springTiming({damping:200})`; Quote N → aggregate via `fade-through` (15f).

## Beat → slots

| Beat | Catalog components | New component needed |
|---|---|---|
| Intro | `tracking-in` (title), `mask-reveal-up` (divider line), `spotlight-card` (bg) | — |
| Quote cycling | `per-word-crossfade` (quote text), `staggered-fade-up` (avatar + author/role), `short-slide-right` (author-line on swap), `fade-through` (scene transition), `blur-out-up` (stack exit) | **`testimonial-card`** — avatar + quote text + name/role; transparent bg; props: `quote`, `name`, `role`, `avatarUrl`; build per `../anatomy.md` §1 |
| Aggregate close | `spring-scale-in` (metric block entrance), `rolling-number` (count animation), `staggered-fade-up` (tagline), `x-followers-overview` or `github-stars` (optional social anchor) | — |

`testimonial-card` is the only gap in the catalog. The stacking depth effect (peek cards at 0.94 scale / 0.5 opacity behind the active card) is orchestration logic in the parent composition — render 2–3 `testimonial-card` instances with interpolated transform/opacity values; no separate stack container component is needed.

## Content contract (infer → ask → placeholder)

| Field | Required | Notes |
|---|---|---|
| `quotes[]` | yes | `{ quote: string; name: string; role: string; avatarUrl?: string }` — 3–5 entries; infer from testimonials page, G2, or press quotes |
| `aggregate` | yes | `{ value: number; label: string }` — e.g. `{ value: 12000, label: "people who found their flow" }`; infer from marketing site or README; never fabricate a number |
| `sectionTitle` | no | Default `"What teams say"`; swap to match brand voice |
| `brand` | no | `{ accent, background }` — one accent on a neutral dark canvas |
| `socialAnchor` | no | `"x-followers" \| "github-stars" \| null` — which catalog social surface to pair with the aggregate close |

`[N]` archetype: quote scenes stretch linearly with quote count; cap at N=5 visible quotes and fold any excess into "+M more" on the aggregate tagline rather than extending runtime or compressing type.

## Notes

- **Background: `spotlight-card` or a slow muted shader on a solid dark base.** `spotlight-card`'s soft light tracks the active card for depth; a slow, muted shader (`shader-water`, `shader-mesh-gradient`) at low `speed` is the alternative for ambient motion. Keep it muted and gentle behind the quote text — no glow blob or radial halo, and never `mesh-gradient-bg`.
- **One accent only.** Apply it to the `rolling-number` payoff and optionally to one emphasized word per quote via `inline-highlight`. Everything else is neutral mono.
- **No glow halos behind quote text.** Depth is conveyed by the peek-card scale/opacity stack (0.94 / 0.5) — that is sufficient.
- **Real quotes, specific attribution.** "Marcus L., Head of Growth at Loom" beats "User, Company". If avatars are unavailable, render initials in a neutral mono circle — never use stock headshots.
- **N cap.** Beyond five quotes the runtime exceeds ~20s; split into a second reel or cut entries. Never extend by shrinking type or compressing hold time.
- **`testimonial-card` stays transparent.** Set the background via `Backdrop` in the example composition, not inside the card itself.
