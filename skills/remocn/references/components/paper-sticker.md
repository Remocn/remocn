# paper-sticker

**Tier:** `remocn` (animation) · **Vibe:** paper · **Natural length:** 120f @ 30fps

A small paper chip that slaps onto the scene over two stop-motion poses — landing oversized, then settling. It keeps a fixed hand-placed tilt per seed plus a per-pose wobble, so it reads as a physical label dropped on a desk. Generic container: the content styling is yours.

## Install

```bash
shadcn add @remocn/paper-sticker
```

Lands at `components/remocn/paper-sticker.tsx`. Pulls in `@remocn/stop-motion`.

## Props

| Prop | Type | Default |
|---|---|---|
| `children` | `React.ReactNode` | required |
| `at` | `number` | `0` |
| `seed` | `string` | `"sticker"` |
| `padding` | `string` | `"10px 16px"` |
| `background` | `string` | `"#fbfaf6"` |
| `borderColor` | `string` | `"rgba(38,36,44,0.55)"` |
| `maxTilt` | `number` | `2.6` |
| `step` | `number` | `3` |

Renders nothing until one pose after `at`, then settles one pose later (`at=6`, `step=3` → appears frame 9, settles frame 12). The wobble is built in — do NOT wrap it in `paper-wobble`.

## Example

```tsx
{labels.map((label, i) => (
  <PaperSticker key={label} at={i * 6} seed={label}>
    <span style={{ fontFamily: "monospace", fontSize: 28 }}>{label}</span>
  </PaperSticker>
))}
```

## Use when

- Short labels, chips, or callout notes should exist as physical taped paper on a stop-motion scene.
- A group of tags should land one after another — stagger `at` by the index, give each its own `seed`.

## Don't use when

- The content is long text or looks like interactive UI — this is a paper prop, not a component sim.
- You need a media frame with a caption underneath — use `polaroid`.
- You were going to add `paper-wobble` on top: the wobble is already here.
