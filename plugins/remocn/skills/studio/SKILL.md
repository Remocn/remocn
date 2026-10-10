---
name: studio
description: >
  Open a Remotion project in Remocn Studio, the desktop app for tuning a video visually and exporting
  mp4. Use when the user wants to open, continue or export a video in Remocn Studio, or right after a
  video is built and they accept the offer to open it there. Also prepares a project so Studio can
  open it.
---

# Remocn Studio hand-off

Remocn Studio (https://remocn.studio) is a desktop app for macOS and Linux. It previews a Remotion
project live, lets the user tune elements by hand, and exports mp4. It only opens folders it
recognises, so a project goes through **Prepare** once and can then be **Opened** any time.

The helper script is `${CLAUDE_SKILL_DIR}/scripts/studio.mjs` (outside Claude Code: `scripts/studio.mjs`
next to this file). It needs only Node and prints one JSON object per command. Run it from the
Remotion project root, or pass the root as the first argument.

## Prepare

```bash
node "${CLAUDE_SKILL_DIR}/scripts/studio.mjs" init <project-root> --name "<video or product name>"
```

What it does, and what to tell the user:

- Writes `.remocn/project.json` (Studio's project manifest: a fresh `projectId`, `revision: 0`, no
  brand) if it isn't there. An existing manifest is never touched: its `projectId` is the project's
  identity in Studio.
- Places Studio's scan at `src/videos/registry.tsx` if missing, and wraps the root in the entry point
  as `registerRoot(withVideos(Root))`. From then on every `src/videos/<slug>/index.tsx` that exports
  `meta` is a composition with id `<slug>`, in Remotion Studio and in Remocn Studio alike. The
  user's own compositions in `Root.tsx` keep working.

In a project the user already had, ask before running it: it edits their entry point (one import, one
wrap) and adds two files.

If the result says `ok: false` with an entry-point reason, the entry point doesn't call
`registerRoot(Root)` exactly once after its imports. Do the wrap by hand: add
`import { withVideos } from "<registry.specifier>";` using the `specifier` from the result (it is
relative to the entry point, e.g. `../src/videos/registry` for `remotion/index.ts`), and change the
call to `registerRoot(withVideos(Root))`. If that isn't possible, explain why to the user.

Then check `npx remotion compositions` lists every video slug.

## Open

Only after the user says yes to opening the project in Studio:

```bash
node "${CLAUDE_SKILL_DIR}/scripts/studio.mjs" open <project-root>
```

Relay the `message` from the result. By `action`:

- `deep-link`: Studio is opening the project and shows a confirmation dialog. Nothing else to do.
- `launched`: Studio is starting but can't be told which folder to open yet. Tell the user to choose
  **Open Folder** (⌘O on macOS, Ctrl+O on Linux) and pick the project root, and give them the path.
- `not-installed`: give the download link (https://remocn.studio) and the same Open Folder steps for
  after installing.
- `unsupported-platform`: Studio doesn't run on this OS. The video still previews with
  `npx remotion studio` and renders with `npx remotion render <slug>`.

If the result says the manifest is missing, run **Prepare** first.

To check whether Studio is installed without opening anything, run the `detect` command.

## Don'ts

- Don't create `.remocn/project.json` by hand or copy one from another project. Two projects with
  the same `projectId` collide in Studio, and it refuses the second.
- Don't move videos out of `src/videos/<slug>/`. Studio identifies a video by its folder name.
- In claude.ai or ChatGPT there is no local project to hand off. Point the user to a coding agent
  (Claude Code, Codex) with this plugin, or to Remocn Studio's own templates.
