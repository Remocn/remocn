# Plan 014: stop-motion core — the quantized clock library

> **Workflow (whole 014–023 series)**: executor implements every file in the
> checklist; the repo owner reviews the result and handles ALL git operations
> (branch, commit, push). Executors edit files only. Do NOT run `bun run build`,
> `bun dev`, or any visual/browser verification — the owner checks himself.
> Running `bun run registry:build` IS implementation (it regenerates committed
> `registry-artifacts/` + `public/r/`), not verification — run it whenever
> `registry/remocn/registry.json` or a component source changes.

## Status

- **Effort**: S
- **Depends on**: —
- **Category**: feature
- **Series**: stop-motion kit (014–023), extracted from the fable-flipbook demo

## Series conventions (read once, applies to plans 014–023)

Source demo (frozen, API-compat NOT required):
`~/projects/opensource/remocn-demo/src/demos/fable-flipbook/`

1. `"use client"` is the first line of every component file. The core
   (`stop-motion`) is a helpers-only library: no directive, no JSX, `.ts`.
2. No code comments of any kind. All copy, sample data, and docs text in English.
3. No added letter-spacing, no uppercase, no badges/pills, no glow. Components
   are transparent — no hardcoded backgrounds — except `paper-field`, which IS
   a background.
4. Ink palette is inlined per component as prop defaults (no shared palette
   export): ink `#26242c`, pencil `rgba(38,36,44,0.55)`, lime ink `#6f7f35`,
   paper `#f1eee7`.
5. Every stepped component takes an optional `step?: number` prop, default `3`
   (10 poses/s at 30fps). There is NO `speed` prop in this kit — `step` is the
   tempo control.
6. All randomness is deterministic via `hashRange` with string seeds.
7. Cross-component imports use the installed path `@/components/remocn/<name>`
   (single-segment, resolved by the existing tsconfig glob). The core is a lib,
   so it is imported as `@/lib/remocn/stop-motion` and needs its own explicit
   tsconfig `paths` entry — mirroring `@/lib/remocn-ui`.
8. Public APIs infer types from params; a consumer never writes `as`.

Per-component touch checklist (plans 015–022; deviations noted per plan):

| # | File | What |
|---|------|------|
| 1 | `registry/remocn/<name>/index.tsx` | the component |
| 2 | `registry/remocn/<name>/config.ts` | `ComponentConfig` for the docs customizer |
| 3 | `registry/remocn/<name>/__tests__/` | `bun:test` for pure helpers (only where they exist) |
| 4 | `registry/remocn/registry.json` | item entry; `registryDependencies: ["@remocn/stop-motion"]` |
| 5 | `bun run registry:build` | regenerate committed artifacts |
| 6 | `content/docs/<section>/<name>.mdx` | frontmatter `title`/`description` WITHOUT `: ` inside values; `<ComponentPreview>`, `<InstallBlock>`, Usage with a full `Root.tsx` example, `<PropsTable>` |
| 7 | `content/docs/<section>/meta.json` | add the page |
| 8 | `registry/__index__.tsx` | config import + lazy `load` entry (post-plan-013 shape); children-based components load an example scene from `components/docs/examples/` instead, like the transitions do |
| 9 | `skills/remocn/references/components/<name>.md` | ref file (header line, Install, Props, Example, Use when / Don't use when) |
| 10 | `skills/remocn/references/components/index.md` | row in the right section table |
| 11 | `content/docs/components.mdx` | `ComponentCardGrid` card in the right section |
| 12 | `plans/README.md` | update the status row |

## Goal

Ship the foundation every stop-motion component depends on: the quantized
clock, stepped springs, deterministic hashing, and per-pose paper jitter —
as a single registry item other items pull in via `registryDependencies`.

## Source

`~/projects/opensource/remocn-demo/src/demos/fable-flipbook/stepped.ts` (74 lines).

## API (contract)

File `registry/remocn/stop-motion/index.ts`:

```ts
export const DEFAULT_STEP = 3;

export const qf = (frame: number, step = DEFAULT_STEP): number;
export const qstep = (frame: number, step = DEFAULT_STEP): number;

export const hash01 = (seed: string): number;
export const hashRange = (seed: string, lo: number, hi: number): number;

export type Jitter = { x: number; y: number; rot: number };
export const paperJitter = (
  frame: number,
  seed: string,
  options?: { amp?: number; rotAmp?: number; step?: number },
): Jitter;

export const steppedSpring = (args: {
  frame: number;
  fps: number;
  delay?: number;
  step?: number;
  config?: { damping?: number; stiffness?: number; mass?: number };
}): number;

export const steppedRamp = (
  frame: number,
  from: number,
  to: number,
  options?: { ease?: (t: number) => number; step?: number },
): number;
```

Changes vs the demo source:

- `STEP` renamed to `DEFAULT_STEP`.
- `paperJitter` positional `amp`/`rotAmp` become an options object (defaults
  `amp: 1.4`, `rotAmp: 0.35`) so `step` fits without a 5th positional.
- `steppedRamp` ease becomes `options.ease` (default identity) for the same
  reason.
- `steppedSpring` gains `step` and threads it into `qf`.
- Behavior of every function is otherwise identical to the demo.

## Registry entry

```json
{
  "name": "stop-motion",
  "type": "registry:lib",
  "title": "Stop Motion Clock",
  "description": "Quantized stop-motion clock for Remotion. Stepped frames, stepped springs, deterministic hashing, and per-pose paper jitter.",
  "dependencies": ["remotion"],
  "files": [
    {
      "path": "stop-motion/index.ts",
      "type": "registry:lib",
      "target": "lib/remocn/stop-motion.ts"
    }
  ]
}
```

## Touch points (deviates from the standard checklist)

Infrastructure item, like the `remocn-ui` core lib: **no docs page, no `__index__` entry, no
`components.mdx` card, no `config.ts`**. It ships silently via
`registryDependencies` of every other kit item.

- `registry/remocn/stop-motion/index.ts`
- `registry/remocn/stop-motion/__tests__/stop-motion.test.ts`
- `registry/remocn/registry.json` + `bun run registry:build`
- `tsconfig.json` — explicit `paths` entry
  `"@/lib/remocn/stop-motion": ["./registry/remocn/stop-motion/index.ts"]`,
  mirroring the existing `@/lib/remocn-ui` entry, so the site resolves the
  dev-time source while installed projects resolve their own copy
- `skills/remocn/references/components/stop-motion.md`
- `skills/remocn/references/components/index.md` — a second prose paragraph
  under **Core library**, shaped like the existing `@remocn/remocn-ui` one.
  That section is prose, not a table: do not convert it.

## Tests (`bun:test`)

- `qf`/`qstep`: quantization boundaries (frame 0/1/2 → 0; frame 3 → 3/1);
  custom `step` honored.
- `hash01`: deterministic per seed; output in `[0, 1)`; distinct seeds differ.
- `hashRange`: stays inside `[lo, hi]`; deterministic.
- `paperJitter`: identical `Jitter` for every frame inside one step; changes
  across steps; respects `amp`/`rotAmp` bounds; deterministic per seed.
- `steppedRamp`: returns 0 at/before `from`, 1 at/after `to`; constant within
  a step; `ease` applied.
- `steppedSpring`: constant within a step; equals `spring()` sampled at the
  quantized frame.

## Acceptance criteria (owner verifies)

1. `bun test registry/remocn/stop-motion` green.
2. `bunx tsc --noEmit` clean.
3. `bunx biome check registry/remocn/stop-motion` clean.
4. Registry drift guard passes (artifacts regenerated and consistent).
5. Item installs standalone: `public/r/stop-motion.json` exists and targets
   `lib/remocn/stop-motion.ts`.

## Out of scope

- Any React components (plans 015–022).
- A docs concept page for the clock (decided against — each component
  documents its own `step` prop).
- Context provider for `step` (decided against — prop with default).
