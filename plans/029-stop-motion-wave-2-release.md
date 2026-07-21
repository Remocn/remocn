# Plan 029: wave-2 release sweep + changelog

> Read plan 014's **Workflow** and **Series conventions** first. This plan
> ships no component; it closes the wave out.

## Status

- **Effort**: S
- **Depends on**: 024, 025, 026, 028 (all merged; 027 was rejected)
- **Category**: chore
- **Wave**: stop-motion wave 2 (024–029)

## Why this plan exists

`CLAUDE.md` requires that any branch adding or materially changing registry
components carries a changelog entry **in the same PR as the feature**. Wave 1
satisfied that with plan 023, which batched seven components into one entry —
a changelog record is a milestone, not a PR, so five PRs still map to one
entry. Wave 2 has no equivalent, and an executor reading plan 014 plus one
component plan will never produce one.

There is also a file the 12-row touch checklist does not name and every wave-1
component nevertheless landed in: `config/site.ts`.

## Changelog entry

`content/changelog/<YYYY-MM-DD>-stop-motion-wave-2.mdx`, dated the day of the
merge.

- Frontmatter: `title` and `date` only, unquoted YAML, no `: ` inside any
  value (it breaks the fumadocs build). No `video`/`videoPoster` unless the
  owner has recorded one — without them the entry simply does not appear in
  the video feed, and the build does not fail.
- Body headings are `###` only; `h1`/`h2` belong to the page.
- Intro frames the wave by what it unlocked rather than by listing parts: the
  kit could not show a list, point at a region, count, or take anything away.
  Now it can.
- `### New components` linking all four to their real docs pages. Do NOT
  mention `tape`: plan 027 was rejected and the component removed.
- One `<ChangelogPreview name="..." />` after the intro. `name` must be a key
  in `registry/__index__.tsx` — `check-list` or `crumple-toss` read best as a
  still-to-motion preview.
- All text in English.

## Sweep 1 — `config/site.ts`

`NEW_BADGE_PATHS` (`config/site.ts:56-64`) currently holds the seven wave-1
paths. Replace them with the four wave-2 docs paths (plan 027 `tape` was
REJECTED and its component removed, so the wave ships four, not five):

```
/docs/ui-blocks/check-list
/docs/effects/scribble-circle
/docs/typography/hand-count
/docs/effects/crumple-toss
```

Verify **both** conditions per path, because only the first is obvious: the
`.mdx` exists, **and** the page is listed in its section's `meta.json`.
`withNewBadges` decorates Fumadocs page-tree items, so a path missing from the
sidebar badges nothing and the miss is invisible on the site.

## Sweep 2 — consistency

Script these rather than eyeballing a diff:

1. Each of the four names resolves to a real docs page, is present in its
   `meta.json`, and has a `components.mdx` card in the section its plan named.
   Also assert `tape` is absent everywhere — no docs page, no `meta.json`
   entry, no card, no registry item, no built artifact, no ref file.
2. For each registry item, the built artifact exists and its `files[0].path`,
   `files[0].target`, `dependencies` and `registryDependencies` match the
   `registry.json` entry — read both sides, do not infer from git.
3. Every `/docs/` link inside the new changelog entry resolves.
4. Four ref files exist under `skills/remocn/references/components/`, each with
   exactly one row in `index.md`, in the section its plan named — note plan 026
   goes under `## Text Animations`, there is no `Typography` heading in that
   file. A fifth ref file, `brush.md`, documents the shared brush library and
   belongs in the prose under `## Core library`, not the tables.
5. `plans/README.md`: 024, 025, 026, 028 marked DONE; 027 REJECTED; 029 DONE.

## Sweep 3 — a pre-existing contradiction the wave makes worse

`skills/remocn/references/components/index.md:12` introduces the **Text
Animations** section with "Frame-driven, shared `speed` prop". Plan 014's
convention 5 says the opposite in as many words: *"There is NO `speed` prop in
this kit — `step` is the tempo control."* `handwrite` already sits under that
heading and already contradicts it; plan 026 adds `hand-count` as a second
offender.

Fix the section prose so it does not promise a prop the stop-motion components
do not have. Do not touch the components.

## Optional, owner decides

`NumberWheel` and `RollingNumber` have docs pages but no `components.mdx`
cards. Plan 026 positions `hand-count` against both, so the gap is now visible
from a shipped page. Adding the two cards is a one-line-each fix; it is listed
here rather than in 026 because it is pre-existing, not caused by this wave.

## Gates

Per plan 014's workflow, the executor runs **`bun run registry:build` only** —
that regenerates committed artifacts and is implementation, not verification.
`bunx tsc --noEmit`, `bunx biome check content skills registry config` and
`bun test` are the **owner's** checks and appear under acceptance criteria
below; the executor does not self-verify and does not run `bun run build` or
`bun dev`. No git operations by the agent.

## Acceptance criteria (owner verifies)

1. The changelog entry renders at `/changelog` and every link in it resolves.
2. All four sidebar entries carry the NEW badge; no wave-1 path still does.
3. The scripted sweep reports zero mismatches.
4. Gates green.

## Out of scope

- A video for the changelog entry — the owner records those.
- Wave-3 planning.
