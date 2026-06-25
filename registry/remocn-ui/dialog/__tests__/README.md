# `dialog` — verification tests

Pure / deterministic verification for the `dialog` component
(`registry/remocn-ui/dialog/`). The RENDER path needs `useRemocnTheme()`
and the Remotion render tree and cannot run headless, so the render is NOT
exercised here. This suite covers the pieces that ARE pure: `DialogState`
union membership, `dialogConfig.controls` wiring, `dialogConfig.snippet`
codegen, `dialogStyle` presets, `tweenDialogStyle` interpolation, and
`DEFAULT_DURATION`.

## Animation model — pure snap + opt-in smooth path

Dialog ships two complementary paths:

**Snap path** (`state?: DialogState` prop):
`Dialog` is a frame-free pure renderer. The `state` prop drives all visuals.
Each state maps to a complete resting visual via the exported pure function
`dialogStyle(state, ctx) => DialogStyle`. State changes snap instantly —
no tweening inside the component.

**Smooth path** (`style?: DialogStyle` prop):
Callers opt in to smooth transitions by passing a pre-interpolated
`DialogStyle` to the `style` prop. The caller — typically
`useDialogTransition` — reads `useCurrentFrame()` and calls
`useStateTransition` from `core/timeline.ts` to compute
`{ from, to, progress }`, then blends the two presets via
`tweenDialogStyle(from, to, t)`. The `Dialog` component itself remains
frame-free; it simply renders whatever `DialogStyle` it receives.

This design keeps `Dialog` pure-testable (no Remotion render context needed)
while still supporting smooth open/close transitions for production use.

## How to run

> **The user (not the agent) runs verification.** Do not run this command
> automatically — always wait for the user to run it.

The repo uses **Bun**, which has a built-in test runner — runs TypeScript
natively, no test-framework dep.

```bash
bun install
bun test registry/remocn-ui/dialog/__tests__
```

`dialog.test.ts` imports `bun:test` (not `vitest`/`jest`), so no test
script or framework dep is added to `package.json`.

## What is covered

- **`DialogState` union** — asserts the two states `["opened", "closed"]`
  are the complete set (via the real `controls.state.options` list from
  `config.ts`).
- **`dialogConfig.controls.state`** — the customizer control wiring. Asserts
  a `select` control exists with exactly those two options in order, default
  `"opened"` (so the preview showcases the popup), and that every option is a
  member of the `DialogState` union.
- **`dialogConfig.snippet`** — REAL pure string builder (high value).
  Asserts: always emits `state="<state>"` for every option; NEVER emits `steps`;
  includes `import { Dialog }` from `@/components/remocn/dialog`;
  omits default-equal props (`title="Edit profile"`, the default description
  `"Make changes to your profile here. Click save when you're done."`,
  `actionLabel="Save changes"`, `cancelLabel="Cancel"`, `mode="light"`); EMITS
  non-default `title`/`description`/`actionLabel`/`cancelLabel`/`mode`;
  structural round-trip (starts with import, contains `<Dialog`, ends `/>`).
  Note: `action=` is not checked for absence because `actionLabel=` is a
  legitimate emitted prop — only `steps` is asserted absent.
- **`dialogStyleContext`** — exported pure `(theme) => DialogStyleContext`
  (takes only `theme`, no variant — unlike accordion). Built from
  `dialogStyleContext(defaultLightTheme)`. Asserts each field
  (`popoverBg`, `popoverFg`, `mutedFg`, `border`, `actionBg`, `actionFg`,
  `cancelFg`) is a non-empty string, and `radius` is a number.
- **`dialogStyle` presets** — exported pure `(state, ctx) => DialogStyle`.
  All four fields (`overlayOpacity`, `popupOpacity`, `popupScale`,
  `popupTranslateY`) are numeric. Asserts per-state invariants: closed →
  `{ 0, 0, 0.95, 8 }`; opened → `{ 1, 1, 1, 0 }`.
- **`tweenDialogStyle`** — exported pure `(a, b, t) => DialogStyle`.
  All four fields are pure numeric lerps (no color fields). Asserts: at t=0 all
  fields equal `a`; at t=1 all equal `b`; at t=0.5 each field is the exact
  midpoint (`overlayOpacity` 0.5, `popupOpacity` 0.5, `popupScale` 0.975,
  `popupTranslateY` 4). Both directions (closed→opened and opened→closed) are
  verified.
- **`DEFAULT_DURATION`** — sanity-checks the exported constant is a positive
  number equal to 12.

**Dialog render** is a pure `(style | state) => visual` observable only via
Remotion render, not unit-tested here.

## Import strategy

`dialog.test.ts` imports via a mix of **relative paths** and the
**`@/lib/remocn-ui` tsconfig alias**:

- `../index` — relative, for `DialogState`, `dialogStyle`,
  `dialogStyleContext`
- `../use-dialog-transition` — relative, for `tweenDialogStyle`,
  `DEFAULT_DURATION`
- `../config` — relative, for `dialogConfig`
- `@/lib/remocn-ui` — alias (resolves to `registry/remocn-ui/core/index.ts`),
  for `defaultLightTheme`

Importing `index.tsx` and `use-dialog-transition.ts` pulls the `remotion`
module (and React), but neither `dialogStyle`, `dialogStyleContext`,
nor `tweenDialogStyle` call `useCurrentFrame()` at import time or at call
time — they are pure value functions. `bun test` resolves tsconfig `paths`, so
the alias works without additional config.

## Determinism grep checklist (run manually; must print NOTHING)

Dialog is a state atom and must be frame-free. The component's `index.tsx`
must contain **none** of the following:

```bash
grep -nE "useState|useEffect|useCurrentFrame|onClick|onChange|addEventListener|Date\.now|Math\.random|requestAnimationFrame" \
  registry/remocn-ui/dialog/index.tsx
```

Expected: no output. Any match is a determinism violation.

`use-dialog-transition.ts` is the CALLER hook that intentionally reads
`useCurrentFrame()` (via `useStateTransition`). It is not a render component;
the smooth-path design isolates all frame-reading to the hook, keeping
`Dialog` pure.

Tier-wide sweep:

```bash
grep -nE "useState|useEffect|onClick|onChange|addEventListener|Date\.now|Math\.random" \
  registry/remocn-ui/dialog/index.tsx registry/remocn-ui/core/*.ts
```
