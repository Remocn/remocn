# remocn-ui — component style guide

The contract every `remocn-ui` primitive follows. Read this before adding a new
component (Input, Checkbox, Switch, …). It is the frozen output of the design
decisions behind `button` + `spinner`; new components copy these patterns
verbatim so the tier stays coherent.

> **Hard rule for contributors and agents:** the user runs ALL verification
> (`bun test`, `bun run registry:build`, `bun dev`) and all commits. Do NOT run
> build / dev / lint / test / registry:build. Verify by reading + `grep` only.

---

## 1. Two kinds of primitive

Every component is exactly one of these. Decide which before writing a line.

### State atom (Button, Input, Checkbox, Switch, …)

A **pure function of its inputs** — `(state | style, theme) => view`. It:

- knows only the **current state** (a string union) or a pre-resolved **visual**;
- knows nothing about time — it never calls `useCurrentFrame`, holds no
  `useState`/`useEffect`, has no `localFrame`, no transition logic;
- **snaps** between states by default. Smooth motion is opt-in and lives
  OUTSIDE the component (see §4).

### Motion atom (Spinner, and future Pulse/Typewriter, …)

A continuous animation with **no discrete states**. It is the ONLY kind of atom
allowed to read `useCurrentFrame()`. Keep it tiny, self-contained, theme-light
(take a `color` prop defaulting to `currentColor`). Example: `spinner` —
`rotation = useCurrentFrame() * speed * 6`, no Date/RAF/random.

State atoms **compose** motion atoms (Button renders `<Spinner/>` in `loading`).

---

## 2. The purity boundary (the line you must not cross)

> The frame is read by **motion atoms** and by the **caller's transition hook**
> (`use<Name>Transition`), NEVER inside a state-atom component.

This is what keeps state atoms deterministic and trivially testable. A state
atom that calls `useCurrentFrame` (directly or via a timeline hook) is a bug.

Determinism grep — must print NOTHING for a state atom's `index.tsx`:

```bash
grep -nE "useState|useEffect|useCurrentFrame|onClick|onChange|addEventListener|Date\.now|Math\.random|requestAnimationFrame" \
  registry/remocn-ui/<name>/index.tsx
```

---

## 3. File layout per state atom

```
registry/remocn-ui/<name>/
  index.tsx                  # pure render + state→visual presets (SHIPS)
  use-<name>-transition.ts   # durations + easing + tween + hook (SHIPS)
  config.ts                  # customizer config (preview-only, NOT shipped)
  __tests__/                 # bun:test + README
```

Motion atoms ship only `index.tsx` (+ optional `config.ts`).

### `index.tsx` — the pure renderer

Exports, by convention (mirror `button`):

- `type <Name>State` — the state union (e.g. `"idle" | "hover" | …`).
- `interface <Name>Style` — the **animated** visual: only the values that change
  between states (transforms, animated colors, child opacities). Static,
  non-animated parts (text color, border, radius, size) are resolved inside the
  component from variant/theme and are NOT in `<Name>Style`.
- `interface <Name>StyleContext` — concrete colors derived once per render from
  `(variant, theme)`.
- `function <name>StyleContext(variant, theme): <Name>StyleContext` — pure.
- `function <name>Style(state, ctx): <Name>Style` — pure preset map. Each state
  is the COMPLETE resting visual for that state (a keyframe, not a delta).
- `interface <Name>Props` — includes `state?: <Name>State` (snap) AND
  `style?: <Name>Style` (smooth; takes precedence over `state`).
- the component: `const v = style ?? <name>Style(state, ctx);` then render from
  `v`. Snap and smooth share ONE render path.

**Child crossfade rule:** when a state swaps content (label ↔ spinner ↔ check),
put opacities in `<Name>Style` (`labelOpacity`, `spinnerOpacity`, …), render ALL
children always, drive them by opacity, and keep the width-defining child in
normal flow (others as absolute overlays) so the box does not jump. The opacity
fields of a preset sum to 1.

### `use-<name>-transition.ts` — the opt-in smoothing (SHIPS, user-editable)

This is shadcn "own your code": it lands in the user's project and they tune
motion by editing it — no config props. Exports:

- `const DEFAULT_DURATION = <n>` — transition length (frames) when a `Step`
  omits `duration`. One number, not a per-state map.
- `function tween<Name>Style(a, b, t): <Name>Style` — blend two visuals: numbers
  lerp, colors via `mixOklch`. Must cover EVERY field (a missing field freezes
  that channel).
- `interface <Name>TransitionOptions` — `{ variant?, theme?, mode?, primary?,
  speed?, defaultDuration? }`.
- `function use<Name>Transition(steps, opts?): <Name>Style` — resolves theme +
  ctx, calls core `useStateTransition`, eases progress (`easings.out` default),
  returns the tweened visual. THIS hook reads the frame (via `useStateTransition`),
  on the caller's side.

---

## 4. State, snap, and smooth

- **Snap (default):** `<Button state="loading" />`. The component renders
  `<name>Style(state, ctx)` — no tween, no clock.
- **Smooth (opt-in):** the caller drives it.
  ```tsx
  const style = useButtonTransition([
    { at: 12, state: "hover" },
    { at: 30, state: "press" },
    { at: 48, state: "loading", duration: 6 },   // per-step override
    { at: 96, state: "success", duration: 16 },
  ]);
  return <Button style={style} />;
  ```
  Mental model: **a state is a named preset of a visual; smooth = feed an
  interpolated visual.** The component cannot tell the difference.

There is no automatic cross-fade baked into the component. Cross-component
*morphs* (button→input) are a separate, deferred composition layer — not a
primitive concern.

---

## 5. The timeline (core `lib/remocn-ui`)

`Step` is the uniform envelope:

```ts
interface Step<S extends string = string> {
  at: number;        // LOCAL (Sequence-relative) authored frame
  state: S;          // per-component state union
  duration?: number; // frames for the transition INTO this state; omit → default
}
```

Two core resolvers (both pure folds; `effectiveFrame = useCurrentFrame()*speed`):

- `useCurrentState(steps, defaultState, speed?) → S` — latest step with
  `at <= effectiveFrame`, else default. For snap-from-timeline.
- `useStateTransition(steps, defaultState, speed?, defaultDuration?) →
  { from, to, progress }` — `to` = latest started step (ties → later array
  entry), `from` = the one before (else default), `progress` ramps 0→1 over
  `[to.at, to.at + (to.duration ?? defaultDuration))` then holds at 1. Before any
  step → `{ from: default, to: default, progress: 1 }`. For smooth transitions.

Other core exports you reuse, never re-implement: `mixOklch` (animated colors),
`useRemocnTheme` / `RemocnUIProvider` / `RemocnTheme` (theming), `easings` /
`springs` (motion), `framesFor` / `revealCount` (typewriter math).

---

## 6. Theming

- JS theme object with stock shadcn token names is the source of truth
  (`RemocnTheme`); defaults match stock shadcn neutral.
- Resolve with `useRemocnTheme(override, mode)`. Order: per-component `theme`
  prop > `RemocnUIProvider` > `defaultLightTheme`/`defaultDarkTheme` per `mode`.
- **Animated colors** must be concrete oklch/hex/rgb and interpolated with
  `mixOklch` — `var(--token)` cannot be resolved by Remotion's headless renderer
  for JS interpolation. Static (never-animated) colors may use `var()` in inline
  `style`.
- Transparent variants (outline/ghost) rest on a concrete `theme.background` so
  the color mix has a real endpoint — never pass the literal `"transparent"` to
  `mixOklch`.

---

## 7. Registry wiring

- A state atom's registry item ships BOTH `index.tsx` → `components/remocn/<name>.tsx`
  AND `use-<name>-transition.ts` → `components/remocn/use-<name>-transition.ts`.
- Declare deps: `dependencies` for npm packages (`remotion`, `culori`),
  `registryDependencies` for sibling registry items (`["remocn-ui", "spinner", …]`).
- Source files import siblings by the **install path** (`@/components/remocn/<name>`),
  not the repo path — that ships correctly to users and resolves in-repo via the
  tsconfig alias `@/components/remocn/* → registry/remocn-ui/*/index.tsx`.
- `config.ts` is preview-only — do NOT list it in registry files.
- The shared core (`remocn-ui` registry:lib, sourced from `core/`) is pulled
  automatically via `registryDependencies`; never duplicate it per component.

---

## 8. Customizer, preview, and the live example

- **`config.ts`**: a `ComponentConfig` with `controls` (a `state` select +
  scalar knobs), `componentName`, `importPath`, and a `snippet(values)` that
  emits the controlled snap form (`<Comp state="…" />`, default-equal props
  omitted). `speed` comes from `SHARED_CONTROLS`.
- Register the component in `registry/__index__.tsx` (`{ Component, config }`).
  The customizer Player passes control values straight to the component.
- **`<ComponentPreview name="<name>" />`** = the interactive customizer (single
  state, snap, live motion atoms).
- **`<LiveExample name="<name>-example" />`** = ONE fixed, non-adjustable demo
  (Player video + copyable code) showing a full smooth lifecycle. **Naming
  convention (locked): the example is `<name>-example`** — `button-example`,
  later `input-example`, `checkbox-example`, … Register it in
  `components/docs/examples/index.tsx` and author the scene + a user-facing code
  string (install paths) in `components/docs/examples/<name>-example.tsx`; keep
  the scene's step timeline and the code string IN SYNC.

---

## 9. Docs

- One page per component: `content/docs/ui/<name>.mdx`, listed in
  `content/docs/ui/meta.json`.
- **MDX frontmatter is unquoted YAML — never use a colon-space (`: `) in
  `title`/`description`** (it breaks the fumadocs build). Use `—` or rephrase.
- Include `<ComponentPreview>`, `<InstallBlock>`, a "Smooth transitions" section
  (`use<Name>Transition`), the `<LiveExample>`, and a `<PropsTable>`.

---

## 10. Tests (bun:test)

- Render output needs `useCurrentFrame()` → NOT unit-tested. Test the PURE
  surface only: the core resolvers (spec-mirror in `core/__tests__/timeline.test.ts`),
  the exported `<name>Style` presets + `tween<Name>Style`, and `config` snippet
  codegen.
- Mirror impure folds (anything calling `useCurrentFrame`) as pure replicas with
  the frame injected as `raw`; annotate the source lines they mirror and keep
  them in lockstep.
- Use relative imports for component source, `@/lib/remocn-ui` for the core
  alias. Add a `__tests__/README.md` with the determinism grep checklist.

---

## 11. Naming cheat-sheet

| Thing | Convention | Example |
|---|---|---|
| Component dir / install name | kebab | `button`, `spinner` |
| Component export | PascalCase | `Button`, `Spinner` |
| State union | `<Name>State` | `ButtonState` |
| Visual / preset / ctx | `<Name>Style` / `<name>Style` / `<name>StyleContext` | `ButtonStyle` |
| Transition file | `use-<name>-transition.ts` | `use-button-transition.ts` |
| Transition hook | `use<Name>Transition` | `useButtonTransition` |
| Tween | `tween<Name>Style` | `tweenButtonStyle` |
| Live example | `<name>-example` | `button-example` |
| Docs page | `content/docs/ui/<name>.mdx` | `button.mdx` |
