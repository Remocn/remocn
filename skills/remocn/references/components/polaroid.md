# polaroid

**Tier:** `remocn` (animation) · **Vibe:** paper · **Natural length:** 150f @ 30fps

An instant-photo frame: a media window on card stock with a handwritten caption beneath. The media is `children`, so a video, an image, or a whole live composition can play inside — the scene keeps the real 30fps clock while the card around it moves in stop-motion poses. The living-photograph centrepiece of the kit.

## Install

```bash
shadcn add @remocn/polaroid
```

Lands at `components/remocn/polaroid.tsx`. Pulls in `@remocn/handwrite`, which pulls in `@remocn/stop-motion`.

## Props

| Prop | Type | Default |
|---|---|---|
| `children` | `React.ReactNode` | required |
| `caption` | `string` | — |
| `captionAt` | `number` | `0` |
| `width` | `number` | `652` |
| `frameColor` | `string` | `"#fdfcf8"` |
| `captionColor` | `string` | `"#26242c"` |
| `captionSize` | `number` | scales from `width` (36 at 652) |
| `step` | `number` | `3` |

Every measurement derives from `width`, keeping the original print's proportions at any size. Give the media child `width: 100%` and `height: 100%`; `objectFit` is the child's concern.

## Example

```tsx
<Polaroid caption="first light">
  <OffthreadVideo
    src={staticFile("clip.mp4")}
    muted
    style={{ width: "100%", height: "100%", objectFit: "cover" }}
  />
</Polaroid>
```

## Use when

- Media belongs in a hand-placed instant-photo frame with a handwritten caption.
- You want a live composition to keep playing inside a stop-motion scene, with no pre-rendered file.
- The photograph should stop being live at some point — wrap the child in Remotion's `<Freeze>`.

## Don't use when

- You just need a plain rounded video frame with no paper story — use `backdrop` with padding.
- The card needs to wobble or sit at an angle: this component has no jitter and no positioning. Wrap it in `paper-wobble` and place it yourself.
