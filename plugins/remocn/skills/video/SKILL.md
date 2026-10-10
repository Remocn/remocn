---
name: video
description: >
  Make a complete Remotion video from a short brief with remocn components: pick the archetype, plan
  a storyboard with frame budgets, install the components, compose the scenes, check the render and
  offer to open the project in Remocn Studio. Use when the user asks for a whole video (product demo,
  launch, feature announcement, changelog, OSS showcase, CLI demo, testimonials, year in review,
  pricing, logo bumper), not a single component.
---

# Make a video with remocn

The brief: $ARGUMENTS

Load the `remocn` skill before anything else. It carries the conventions this flow relies on (the two
component tiers, Canvas & timing, design defaults) and the recipes in its
`references/archetypes/`. This skill is the order of work; that one is the knowledge.

Work through the steps in order. Don't skip the storyboard confirmation: it is the cheapest point to
change direction.

## 1. Read the brief and the project

- Pull the content from the brief and the repo before asking: `README`, landing copy,
  `package.json`, recent releases. Ask only for what is still missing, in one message, and fall back
  to honest placeholders rather than blocking.
- Pick the archetype from the `remocn` skill's `references/archetypes/index.md` and read that
  recipe. Its content contract tells you what to gather; its duration variants set the target length
  when the brief doesn't.

## 2. Plan the storyboard

Plan it in the format of [references/storyboard.md](references/storyboard.md).

- If the `remocn:video-director` agent is available, hand it the brief, the gathered content, the
  archetype and the target length, and take its storyboard back.
- Otherwise plan it yourself: shortlist from `https://remocn.dev/llms-components.txt`, read the
  `.md` page of every pick, and budget each beat as the format describes.

Show the storyboard to the user **as it is in that format**: the header lines, the table with all its
columns, the install line and the missing-content list. Don't retell it as prose or reshape the
table. A few lines above it on the choices you made are fine. Then **wait for a yes or for
changes**, and apply changes to the table, not straight to code.

## 3. Set up the project

Find out which case you are in:

- **No Remotion project yet** (no `remotion` dependency in `package.json`): create one with
  `npx create-video@latest --yes --blank <folder>`, then work inside it. Remotion is a prerequisite
  of remocn; this is the only time you create it.
- **An existing Remotion project**: work in it as it is. Don't restructure the user's code.

Then, in both cases:

1. Make `shadcn add` work in the project:

   ```bash
   node "${CLAUDE_SKILL_DIR}/scripts/setup.mjs" <project-root>
   ```

   (Outside Claude Code: `scripts/setup.mjs` next to this file.) `shadcn init` refuses Remotion
   projects, and Remotion's bundler ignores tsconfig paths, so the script writes `components.json`
   with the `@remocn` registry, adds the `@/*` path to `tsconfig.json`, and resolves the same alias
   in `remotion.config.ts`. Each step is skipped when the project already has it; relay any
   `warning` in the result.
2. Make the project open in Remocn Studio as-is by following the `studio` skill's **Prepare** step.

For an existing project, say which files these two steps will touch and ask before running them.

## 4. Install and compose

1. Run the storyboard's install line: `npx shadcn add @remocn/<a> @remocn/<b> ...`. Dependencies
   install transitively.
2. Write the video as **`src/videos/<slug>/index.tsx`**. This layout is what Remocn Studio scans,
   and the scan registers it as a Remotion composition with id `<slug>`:

   ```tsx
   export const meta = {
     durationInFrames: 1356, // Planned total from the storyboard
     fps: 30,
     height: 720,
     width: 1280,
   };

   export default function LaunchVideo() {
     return (/* the <TransitionSeries> from the storyboard */);
   }
   ```

   Scenes that grow past a screen of code go next to it in the same folder
   (`src/videos/<slug>/scenes/hook.tsx`), never beside the video folder. Optional extra exports:
   `defaultProps` and a zod `schema`, both forwarded to the composition.
3. Use the exact props from each component's docs page. Sequence lengths come from the storyboard,
   not from guesses.
4. Typecheck (`npx tsc --noEmit`) and list compositions (`npx remotion compositions`). The slug
   must be in the list. Fix every error before moving on. A missing declaration file for a
   component's dependency is fixed with `npm i -D @types/<package>`, not with `any`.

## 5. Check the render

The agent that writes the code never sees the frames, so look at them.

- If the `remocn:scene-reviewer` agent is available, hand it the composition id, the storyboard and
  the project path. Apply the fixes it returns, then ask it to check again. Stop after **two** review
  rounds and tell the user what is still open, if anything.
- Otherwise render stills yourself at the start, the middle of the motion and the end of the hold of
  each beat (`npx remotion still <slug> out/review/<beat>-<frame>.png --frame=<n>`), open the images,
  and check them against the `remocn` skill's quality bar (`references/anatomy.md` §3).

## 6. Hand off

1. Tell the user how to preview (`npx remotion studio`) and render
   (`npx remotion render <slug> out/<slug>.mp4`).
2. Offer **"Open in Remocn Studio to tweak and export?"** and, on a yes, follow the `studio` skill's
   **Open** step. Remocn Studio is a desktop app for tuning elements visually and exporting mp4;
   skip the offer on Windows, where it isn't available.
