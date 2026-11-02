# remocn

Make Remotion videos from [remocn](https://remocn.dev) components. remocn is a shadcn registry of
production-ready animations, transitions, backgrounds, captions, UI primitives and video templates for
[Remotion](https://www.remotion.dev). This plugin turns a one-line brief into a video project that
renders: it plans a storyboard, installs the components, composes the scenes, checks the rendered
frames, and offers to open the result in [Remocn Studio](https://remocn.studio).

```text
/remocn:video 30-second product demo for Tasklane, a shared task inbox for small teams
```

## What's inside

| Component | Kind | What it does |
|---|---|---|
| `remocn` | Skill | Conventions for picking and composing remocn components: the two component tiers, timing rules, design defaults, and recipes for nine video archetypes. Loads on its own for Remotion video work |
| `video` | Skill (`/remocn:video`) | Brief → archetype → storyboard → install → compose → visual check → hand-off. Stops after the storyboard and waits for the user's confirmation before writing code |
| `changelog` | Skill (`/remocn:changelog`) | Collects a release from git tags, commits or merged pull requests and builds a changelog video |
| `add` | Skill (`/remocn:add`) | Installs one component and shows how to place it on the timeline |
| `studio` | Skill (`/remocn:studio`) | Prepares a project for Remocn Studio and opens it there |
| `video-director` | Agent (Claude Code) | Plans the storyboard and frame budget |
| `scene-reviewer` | Agent (Claude Code) | Renders stills at key frames and reports clipped text, empty frames and low contrast |
| `remocn` | MCP server | `https://remocn.dev/mcp`: read-only component search, component docs, video plans and in-chat previews. No authentication |

## What it runs, reads and writes

Everything below happens in the user's own project, in the open, through the agent's normal tool
permissions. The plugin has no hooks and runs nothing on its own.

**Network.** The skills read public documentation from `https://remocn.dev`
(`/llms-components.txt` and `/docs/**.md`) and install components from the public registry at
`https://remocn.dev/r/<name>.json` through the shadcn CLI. The MCP server is `https://remocn.dev/mcp`.
Nothing about the user, their project or their prompts is sent anywhere else, and the plugin collects
no telemetry.

**Commands the agent runs**, each one shown to the user:

- `npx create-video@latest --yes --blank <folder>`: only when the folder has no Remotion project yet
- `npx shadcn@latest add @remocn/<name>`: installs components as source files into the project
- `npx tsc --noEmit`, `npx remotion compositions`, `npx remotion still`, `npx remotion render`: type checks,
  lists compositions and renders frames locally
- `git log`, `git tag` and, if installed, `gh pr list`: only in the changelog workflow, read-only
- `node skills/video/scripts/setup.mjs <project>` and `node skills/studio/scripts/studio.mjs <command> <project>`:
  two dependency-free Node scripts in this plugin, described below

**Files it writes in the user's project:**

- `setup.mjs` makes `npx shadcn add` work in a Remotion project. It creates `components.json` (or adds
  the `@remocn` registry to an existing one), adds an `@/*` path to `tsconfig.json`, and adds the same
  alias to `remotion.config.ts`. Each edit is skipped when the project already has it
- `studio.mjs init` writes Remocn Studio's project manifest `.remocn/project.json` if it is missing,
  places Studio's composition scan at `src/videos/registry.tsx`, and wraps the root in the Remotion entry
  point as `registerRoot(withVideos(Root))`. It never overwrites an existing manifest and refuses entry
  points it can't parse instead of guessing
- The video itself goes to `src/videos/<slug>/index.tsx`, and review stills to `out/review/`

In a project the user already had, the skills tell the agent to list these edits and ask first.

**Local app detection.** `studio.mjs detect` and `studio.mjs open` check whether Remocn Studio is
installed (`mdfind` for the bundle id `com.remocn.remocn-studio` on macOS, `xdg-mime` for the
`remocn-studio://` handler on Linux) and, after the user agrees, start it with `open -b` or
`gtk-launch`. On other systems they do nothing.

## Requirements

Node.js 18 or newer for the Remotion project and the helper scripts. Remocn Studio is optional and
available for macOS and Linux.

## Links

- Documentation: https://remocn.dev/docs/getting-started/plugin
- Source and issues: https://github.com/Remocn/remocn
- Privacy and terms: https://remocn.dev/legal

## License

MIT
