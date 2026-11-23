# remocn

Make Remotion videos from [remocn](https://remocn.dev) components. remocn is a shadcn registry of
production-ready animations, transitions, backgrounds, captions, UI primitives and video templates for
[Remotion](https://www.remotion.dev). This plugin turns a one-line brief into a video project that
renders: it plans a storyboard, installs the components, composes the scenes, checks the rendered
frames, and points you to [Remocn Studio](https://remocn.studio) for tuning and export.

```text
/remocn:video 30-second product demo for Tasklane, a shared task inbox for small teams
```

## Install

```text
/plugin install remocn --marketplace Remocn/remocn
```

## What's inside

| Component | Kind | What it does |
|---|---|---|
| `remocn` | Skill | Conventions for picking and composing remocn components: the two component tiers, timing rules, design defaults, and recipes for nine video archetypes. Loads on its own for Remotion video work |
| `video` | Skill (`/remocn:video`) | Brief → archetype → storyboard → install → compose → visual check → hand-off. Stops after the storyboard and waits for the user's confirmation before writing code |
| `changelog` | Skill (`/remocn:changelog`) | Collects a release from git tags, commits or merged pull requests and builds a changelog video |
| `add` | Skill (`/remocn:add`) | Installs one component and shows how to place it on the timeline |
| `setup` | Skill (`/remocn:setup`) | Makes a Remotion project ready for `npx shadcn add @remocn/<name>` |
| `video-director` | Agent (Claude Code) | Plans the storyboard and frame budget |
| `scene-reviewer` | Agent (Claude Code) | Renders stills at key frames and reports clipped text, empty frames and low contrast |
| `remocn` | MCP server | `https://remocn.dev/mcp`: read-only component search, component docs, video plans and in-chat previews. No authentication |

## What it runs, reads and writes

Everything below happens in the user's own project, in the open, through the agent's normal tool
permissions. The plugin has no hooks, ships no scripts and runs nothing on its own.

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

**Files it writes in the user's project:**

- The `setup` skill makes `npx shadcn add` work in a Remotion project. The agent creates
  `components.json` (or adds the `@remocn` registry to an existing one), adds an `@/*` path to
  `tsconfig.json`, and adds the same alias to `remotion.config.ts`. Each edit is skipped when the
  project already has it
- The video itself goes to `src/videos/<slug>/index.tsx` and is registered as a composition in the
  project's root component. Review stills go to `out/review/`

In a project the user already had, the skills tell the agent to list these edits and ask first.

## Requirements

Node.js 18 or newer for the Remotion project. Remocn Studio is optional and available for macOS and
Linux.

## Links

- Documentation: https://remocn.dev/docs/getting-started/plugin
- Source and issues: https://github.com/Remocn/remocn
- Privacy and terms: https://remocn.dev/legal

## License

MIT
