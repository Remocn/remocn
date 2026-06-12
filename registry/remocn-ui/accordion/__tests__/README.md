# `accordion` — verification tests

Pure / deterministic verification for the `accordion` component
(`registry/remocn-ui/accordion/`). The RENDER path needs `useRemocnTheme()`
and the Remotion render tree and cannot run headless, so the render is NOT
exercised here. This suite covers the pieces that ARE pure: `AccordionState`
union membership, `accordionConfig.controls` wiring, `accordionConfig.snippet`
codegen, `accordionStyle` presets, `tweenAccordionStyle` interpolation, and
`DEFAULT_DURATION`.

## Animation model — pure snap + opt-in smooth path

Accordion ships two complementary paths:

**Snap path** (`state?: AccordionState` prop):
`Accordion` is a frame-free pure renderer. The `state` prop drives all visuals.
Each state maps to a complete resting visual via the exported pure function
`accordionStyle(state, ctx) => AccordionStyle`. State changes snap instantly —
no tweening inside the component.

**Smooth path** (`style?: AccordionStyle` prop):
Callers opt in to smooth transitions by passing a pre-interpolated
`AccordionStyle` to the `style` prop. The caller — typically
`useAccordionTransition` — reads `useCurrentFrame()` and calls
`useStateTransition` from `core/timeline.ts` to compute
`{ from, to, progress }`, then blends the two presets via
`tweenAccordionStyle(from, to, t)`. The `Accordion` component itself remains
frame-free; it simply renders whatever `AccordionStyle` it receives.

This design keeps `Accordion` pure-testable (no Remotion render context needed)
while still supporting smooth open/close transitions for production use.

## How to run

The repo uses **Bun**, which has a built-in test runner — runs TypeScript
natively, no test-framework dep.

```bash
bun install
bun test registry/remocn-ui/accordion/__tests__
```

`accordion.test.ts` imports `bun:test` (not `vitest`/`jest`), so no test script
or framework dep is added to `package.json`.

## What is covered

- **`AccordionState` union** — asserts the two states `["opened", "closed"]`
  are the complete set (via the real `controls.state.options` list from
  `config.ts`).
- **`accordionConfig.controls.state`** — the customizer control wiring. Asserts
  a `select` control exists with exactly those two options in order, default
  `"opened"` (so the preview showcases the revealed panel), and that every
  option is a member of the `AccordionState` union.
- **`accordionConfig.controls.variant`** — asserts a `select` control with
  options `["default", "ghost"]`, default `"default"`.
- **`accordionConfig.snippet`** — REAL pure string builder (high value).
  Asserts: always emits `state="<state>"` for every option; NEVER emits `steps`
  or `action`; includes `import { Accordion }` from
  `@/components/remocn/accordion`; omits default-equal props (`title="Is it
  accessible?"`, `content="Yes. It adheres to the WAI-ARIA design pattern."`,
  `variant="default"`, `mode="light"`); EMITS non-default
  `title`/`content`/`variant`/`mode`; structural round-trip (starts with
  import, contains `<Accordion`, ends `/>`).
- **`accordionStyle` presets** — exported pure `(state, ctx) => AccordionStyle`
  map. An `AccordionStyleContext` is built from
  `accordionStyleContext("default", defaultLightTheme)` — the same call the
  component makes internally. Asserts per-state numeric invariants
  (`panelHeight`, `panelOpacity`, `chevronRotation`) and that `background` is
  always a non-empty string. Also asserts the closed/opened invariant: closed
  has all three numeric fields at 0; opened has `panelHeight` 1, `panelOpacity`
  1, `chevronRotation` 180.
- **`tweenAccordionStyle`** — exported pure `(a, b, t) => AccordionStyle`.
  Asserts: at t=0 all numeric fields equal `a`; at t=1 all equal `b`; at t=0.5
  each numeric field is the exact midpoint (e.g. `panelHeight` 0→1 gives 0.5,
  `chevronRotation` 0→180 gives 90, `panelOpacity` 0→1 gives 0.5).
  `background` at all t is a non-empty string (the oklch mix value is not
  hardcoded). Both directions (closed→opened and opened→closed) are verified.
- **`DEFAULT_DURATION`** — sanity-checks the exported constant is a positive
  number equal to 14.

**Accordion render** is a pure `(style | state) => visual` observable only via
Remotion render, not unit-tested here.

## Import strategy

`accordion.test.ts` imports via a mix of **relative paths** and the
**`@/lib/remocn-ui` tsconfig alias**:

- `../index` — relative, for `AccordionState`, `accordionStyle`,
  `accordionStyleContext`
- `../use-accordion-transition` — relative, for `tweenAccordionStyle`,
  `DEFAULT_DURATION`
- `../config` — relative, for `accordionConfig`
- `@/lib/remocn-ui` — alias (resolves to `registry/remocn-ui/core/index.ts`),
  for `defaultLightTheme`

Importing `index.tsx` and `use-accordion-transition.ts` pulls the `remotion`
module (and React), but neither `accordionStyle`, `accordionStyleContext`, nor
`tweenAccordionStyle` call `useCurrentFrame()` at import time or at call time —
they are pure value functions. `bun test` resolves tsconfig `paths`, so the
alias works without additional config.

## Determinism grep checklist (run manually; must print NOTHING)

Accordion is a state atom and must be frame-free. The component's `index.tsx`
must contain **none** of the following:

```bash
grep -nE "useCurrentFrame|useState|useEffect|onClick|onChange|addEventListener|Date\.now|Math\.random" \
  registry/remocn-ui/accordion/index.tsx
```

Expected: no output. Any match is a determinism violation.

`use-accordion-transition.ts` is the CALLER hook that intentionally reads
`useCurrentFrame()` (via `useStateTransition`). It is not a render component;
the smooth-path design isolates all frame-reading to the hook, keeping
`Accordion` pure.

Tier-wide sweep:

```bash
grep -nE "useState|useEffect|onClick|onChange|addEventListener|Date\.now|Math\.random" \
  registry/remocn-ui/accordion/index.tsx registry/remocn-ui/core/*.ts
```
