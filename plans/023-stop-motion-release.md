# Plan 023: stop-motion release — changelog and consistency sweep

> Read plan 014's **Workflow** and **Series conventions** first.

## Status

- **Effort**: S
- **Depends on**: 014–022 (all implemented and owner-verified)
- **Category**: release

## Goal

Close the milestone: one changelog entry for the whole kit, plus a sweep that
catches every touch point the per-component plans could have left inconsistent.

## Changelog entry

`content/changelog/<YYYY-MM-DD>-stop-motion.mdx` — date in the filename is
the MERGE date; the owner supplies it at commit time (author with today's
date, owner renames if the merge slips — the file must not be renamed after
publishing).

- Frontmatter: `title` and `date`, unquoted YAML, NO `: ` inside values.
  Title: `The stop-motion kit`. No `video`/`videoPoster` for now — the owner
  can add the pair later per the CDN convention once a reel exists.
- Body (all English):
  - One intro paragraph on the concept: the world ticks at ~10 poses per
    second while media inside it plays smooth — living photographs.
  - `### New components` — the seven visible items linked to their docs pages
    (`handwrite`, `ink-underline`, `paper-wobble`, `ink-arrow`,
    `paper-sticker`, `polaroid`, `page-turn`) with one-line descriptions.
    `paper-field` is NOT in this list: plan 019 was REJECTED and the component
    removed. Mention the shared `stop-motion` clock ships underneath via
    registry dependencies.
  - `<ChangelogPreview name="handwrite" />` after the intro paragraph.
- H1/H2 belong to the page; only `###` inside the body.

## Consistency sweep (fix anything found)

1. **Meta files**: `typography`, `effects`, `layout`, `ui-blocks`,
   `transitions` meta.json all list their new pages; every listed page file
   exists.
2. **components.mdx**: Effects section exists with PaperWobble + InkArrow;
   Paper & Scrapbook subsection has PaperSticker + Polaroid; Typography has
   Handwrite + InkUnderline; Transitions has PageTurn. Layout gains nothing —
   plan 019 (PaperField) was REJECTED and the component removed.
   Optional consistency fix (owner call, do it unless vetoed): ADD a
   `Confetti` card to the Effects section. Note: there is no existing Confetti
   card anywhere in `components.mdx` to move — the component has a docs page
   (`content/docs/effects/confetti.mdx`) but was never carded. Verified during
   plan 017, which created the `## Effects` section.
3. **Skill catalog**: `skills/remocn/references/components/` has all eight ref
   files (seven components plus `stop-motion.md`); `index.md` has all seven
   component rows in the right sections, alphabetical
   within their tables; if `skills/remocn/SKILL.md`, `references/anatomy.md`,
   or `references/archetypes/` state component counts or category lists,
   update them to include the paper/stop-motion voice.
4. **Registry artifacts**: `bun run registry:build` has been re-run, and
   registry.json and the generated artifacts agree by inspection — for all
   eight items `registry-artifacts/<name>.json` exists and its `files[0].path`,
   `files[0].target`, `dependencies` and `registryDependencies` match the
   registry.json entry. Establish this by reading both sides, not by
   `git diff` — the agent never touches git.
5. **Dangling references**: `grep -rn "stop-motion\|handwrite\|ink-underline\|paper-wobble\|ink-arrow\|paper-field\|paper-sticker\|polaroid\|page-turn" content/ --include="*.mdx" -l`
   — every hit resolves to a real page/anchor; no plan promised a page that
   does not exist.
6. **plans/README.md**: all series rows updated to their final status.

## Acceptance criteria (owner verifies)

1. `/changelog` renders the new entry; `/changelog/video` is unaffected (no
   `video` field — the entry simply does not appear there).
2. Docs sidebar shows all seven components in their four sections; every
   preview loads.
3. Sweep checklist above finds nothing left to fix.
4. Standard: tests, typecheck, biome, registry drift clean.

## Out of scope (recorded backlog, wave 2+)

- `ink-draw` — generalized pen-contour + hatch-fill of an arbitrary SVG path
  (the demo's `InkMark` stays demo-only until a second real use case).
- Ink annotations: `scribble-circle`, `ink-cross-out`, `doodles`.
- Paper objects: `tape`, `rubber-stamp`, `torn-paper` (transition),
  `crumple-toss` (exit).
- Compositions: `polaroid-stack` (flip-through stack), `photo-scatter`
  (desk deal-out + camera pull-back).
- Rejected: ruled/grid paper-field variants, cork-board genre.
