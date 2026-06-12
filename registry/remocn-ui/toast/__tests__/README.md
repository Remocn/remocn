# `toast` — verification tests

Pure / deterministic verification for the `toast` component
(`registry/remocn-ui/toast/`). The render path (`index.tsx`) imports
`useRemocnTheme` which requires React context and cannot run headlessly — it
is NOT exercised here. This suite covers everything that IS pure:
`toastStyle` presets, `toastStyleContext` icon-color derivation,
`tweenToastStyle` interpolation, the `useToastTransition` pure resolver
mirror, and `toastConfig` controls wiring + snippet codegen.

## Animation model — state atom with smooth opt-in

Toast follows the standard state-atom pattern (see STYLE-GUIDE §1):

**Snap path** (`state?: ToastState` prop):  
`<Toast>` is a frame-free pure renderer. The `state` prop drives all visuals.
Each state maps to a complete resting keyframe via the exported pure function
`toastStyle(state) => ToastStyle`. State changes snap — no tweening inside
the component.

**Smooth path** (`style?: ToastStyle` prop):  
Callers opt in to smooth enter/dismiss by passing a pre-interpolated
`ToastStyle` to the `style` prop. The caller — typically `useToastTransition`
— reads `useCurrentFrame()` via `useStateTransition`, applies `easings.out`
to the raw linear progress, and blends the two state presets via
`tweenToastStyle(from, to, t)`. The `<Toast>` component remains frame-free;
it renders whatever `ToastStyle` it receives.

**No color tween:** `ToastStyle` carries only `opacity`, `translateY`, and
`scale` — all numeric. There are no animated color channels, so
`tweenToastStyle` is a simple three-field lerp with no `mixOklch` call.

**Icon color** is a static-per-render derived from variant + theme via
`toastStyleContext` — it does not animate.

## How to run

The repo uses **Bun**, which has a built-in test runner — runs TypeScript
natively, no test-framework dep.

```bash
bun install
bun test registry/remocn-ui/toast/__tests__
```

`toast.test.ts` imports `bun:test` (not `vitest`/`jest`), so no test script
or framework dep is added to `package.json`.

## What is covered

- **`DEFAULT_DURATION`** — asserts the constant is 12 frames.

- **`toastStyle` presets** — exported pure `(state) => ToastStyle`. Asserts
  every field for every state: `hidden` gives `{opacity:0, translateY:16,
  scale:0.97}`; `visible` gives `{opacity:1, translateY:0, scale:1}`. Also
  asserts all fields are numeric for every state, and that the two states
  have distinct values on every field (no silent identity).

- **`toastStyleContext`** — exported pure `(variant, theme) => { iconColor }`.
  Asserts: `default` variant returns `theme.mutedForeground`; `success`
  returns the hardcoded `"oklch(0.6 0.17 150)"` regardless of theme; `error`
  returns `theme.destructive` (varies between light/dark themes). Asserts
  all variants produce a non-empty string iconColor.

- **`tweenToastStyle`** — exported pure `(a, b, t) => ToastStyle`. Asserts:
  at t=0 all three fields equal `a`; at t=1 all equal `b`; at t=0.5 each
  field is the exact midpoint (`opacity` 0→1 gives 0.5, `translateY` 16→0
  gives 8, `scale` 0.97→1 gives 0.985); at t=0.25 gives 0.25/12/0.9775;
  identity case (a===b, any t) preserves all fields. Also covers the reverse
  direction (visible→hidden dismiss).

- **`useToastTransition` resolver replica** — `resolveToastTransition` mirrors
  `use-toast-transition.ts` lines 47-60 with `raw` injected in place of
  `useCurrentFrame()`. The replica re-derives only the logic BEYOND the core
  `useStateTransition` (already tested in `core/__tests__/timeline.test.ts`);
  the key additional contract is that `progress` is eased with `easings.out`
  before the tween. Asserts: before any step → hidden style with both
  endpoints `hidden`; exactly at a step boundary → progress=0 → t=out(0)=0
  → style equals `hidden` keyframe; mid-window at raw=6/dur=12 (linear
  progress=0.5) → t=out(0.5)=0.875 → opacity=0.875 (not linear 0.5);
  translateY=2 (=16×(1−0.875)); scale=0.99625; past the window → fully
  visible style; speed contract (speed=2 halves the raw frame to reach a
  step).

- **`toastConfig.controls`** — control wiring assertions: `state` is a
  `select` with options `["hidden","visible"]` and default `"visible"`;
  `variant` is a `select` with options `["default","success","error"]` and
  default `"success"`; `mode` is a `select` with options `["light","dark"]`
  and default `"light"`; `title` and `description` are `text` controls;
  `title` default is `"Changes saved"`.

- **`toastConfig.snippet`** — pure JSX string builder. Asserts: `import {
  Toast }` from the correct path; `<Toast` element and closing `/>` always
  present; `state` is always emitted; `title` is always emitted (it is a
  required prop, including when equal to the default); non-default title
  emits the provided string; default `variant="success"`, `mode="light"`, and
  default description are omitted; non-default variant/mode/description are
  emitted; all state options round-trip correctly.

**Toast render** is a pure `(style | state) => visual` observable only via
Remotion render; it is not unit-tested here.

## Import strategy

`toast.test.ts` imports via **relative paths** and the `@/lib/remocn-ui`
alias:

- `../index` — relative, for `toastStyle`, `toastStyleContext`, `ToastState`,
  `ToastVariant`
- `../use-toast-transition` — relative, for `tweenToastStyle`,
  `DEFAULT_DURATION`
- `../config` — relative, for `toastConfig`
- `@/lib/remocn-ui` — alias, for `defaultLightTheme`, `defaultDarkTheme`,
  `easings`, `clamp01`, and `Step` type

`useToastTransition` is NOT imported — it calls `useStateTransition` which
reads `useCurrentFrame()`. Its pure logic is mirrored as `resolveToastTransition`
with the frame injected as `raw`. `bun test` resolves tsconfig `paths`, so
the alias works without additional config.

## Determinism grep checklist (run manually; must print NOTHING)

`toast/index.tsx` is a pure renderer — the component must contain **none** of
the following:

```bash
grep -nE "useState|useEffect|useCurrentFrame|onClick|onChange|addEventListener|Date\.now|Math\.random|requestAnimationFrame" \
  registry/remocn-ui/toast/index.tsx
```

Expected: **no output**. Any match is a determinism violation.

`use-toast-transition.ts` is the caller hook that intentionally reads
`useCurrentFrame()` (via `useStateTransition`). That is correct and expected;
the smooth-path design isolates all frame-reading to the hook, keeping
`<Toast>` pure.

Tier-wide sweep for `index.tsx`:

```bash
grep -nE "useState|useEffect|onClick|onChange|addEventListener|Date\.now|Math\.random" \
  registry/remocn-ui/toast/index.tsx registry/remocn-ui/core/*.ts
```
