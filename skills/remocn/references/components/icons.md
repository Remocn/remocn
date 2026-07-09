# icons

**Tier:** `remocn` (icons) · **Deps:** `@remocn/icons-core` (auto-installed)

Animated [Lucide](https://lucide.dev) line icons re-authored for Remotion. Each one draws itself on, then performs a small icon-specific action — frame-driven and deterministic (same frame → same pixels). One reference file for the whole set; there are no per-icon files.

## Install

```bash
shadcn add @remocn/icon-<name>
```

Lands at `components/remocn/icon-<name>.tsx`; the shared library installs to `lib/remocn-icons/` via the registry dependency.

## Motion system

Two phases, chosen by the `animation` prop:

- **Draw** — strokes trace on, staggered by path, while the glyph springs into place.
- **Action** — a short gesture that reads the icon's meaning (a check stamps, a bell rings, a heart beats).

`animation="both"` (default) draws then acts; `"draw"` is a calm entrance with no action; `"action"` skips the draw and performs the action from frame 0 (icon starts fully drawn).

There is no `delay` prop — offset an icon in time with `<Sequence from={n}>` and scale its tempo with `speed` (`frame * speed`), the same idiom as the text animations.

Every icon also exports a static variant `<Pascal>IconStatic` (e.g. `CheckIconStatic`) — the fully-drawn SVG with no Remotion hooks, for non-animated use.

## Props

Shared `IconAnimationProps` across every icon:

| Prop | Type | Default |
|---|---|---|
| `animation` | `"draw" \| "action" \| "both"` | `"both"` |
| `loop` | `boolean` | per icon |
| `speed` | `number` | `1` |
| `size` | `number` | `48` |
| `color` | `string` | `"currentColor"` |
| `strokeWidth` | `number` | `2` |
| `className` | `string` | — |

Loops by default (pass `loop={false}` to play once): `loader`, `refresh-cw`, `sparkles`, `flame`.

## Example

```tsx
import { AbsoluteFill, Sequence } from "remotion";
import { CheckIcon } from "@/components/remocn/icon-check";
import { SoftBlurIn } from "@/components/remocn/soft-blur-in";

export const Scene = () => (
  <AbsoluteFill className="items-center justify-center gap-6">
    <Sequence from={0}>
      <CheckIcon size={64} color="#22c55e" />
    </Sequence>
    <Sequence from={12}>
      <SoftBlurIn text="Done" />
    </Sequence>
  </AbsoluteFill>
);
```

## Pick an icon

| Icon | Use for | Avoid for | Loop | Length |
|---|---|---|---|---|
| `icon-check` | Marking a step, task, or claim as done in a demo scene | A success state that needs a container — compose with a circle or badge from the ui tier instead | no | 60f |
