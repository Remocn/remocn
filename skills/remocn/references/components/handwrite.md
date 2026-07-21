# handwrite

**Tier:** `remocn` (animation) · **Vibe:** paper · **Natural length:** 120f @ 30fps

Handwritten text laid down letter by letter on the quantized stop-motion clock. Letters arrive one or two per pose, each glyph keeps its own fixed slant and baseline wobble, and the newest letter settles from a slightly heavier press. The core text voice of the stop-motion kit.

## Install

```bash
shadcn add @remocn/handwrite
```

Lands at `components/remocn/handwrite.tsx`. Pulls in `@remocn/stop-motion`.

## Props

| Prop | Type | Default |
|---|---|---|
| `text` | `string` | required |
| `fontSize` | `number` | `54` |
| `color` | `string` | `"#26242c"` |
| `delay` | `number` | `0` |
| `perStep` | `number` | `1.6` |
| `weight` | `400 \| 500 \| 600 \| 700` | `600` |
| `align` | `"left" \| "center"` | `"center"` |
| `fontFamily` | `string` | bundled Caveat |
| `step` | `number` | `3` |

Also exports `handwriteDuration(text, { perStep?, step? })` — the frame count a string needs, for sizing a `<Sequence>`.

## Example

```tsx
<Handwrite text="Made by hand" fontSize={72} />
```

## Use when

- Captions, labels, and headlines should read as pen-written on paper — the core text voice of stop-motion scrapbook scenes.
- The scene already ticks on the stop-motion clock and the text must share its tempo rather than glide against it.
- You need the writing time up front: `handwriteDuration` sizes the `<Sequence>` exactly.

## Don't use when

- You are simulating a terminal or an input being typed into — use `typewriter`.
- The reveal should be smooth on the real 30fps clock — use `soft-blur-in` or `per-character-rise`.
- The whole sheet should wobble too: that is `paper-wobble` wrapped around this, not a prop here.
