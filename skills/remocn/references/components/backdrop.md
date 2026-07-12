# backdrop

**Tier:** `remocn` (animation) · **Vibe:** clean · **Natural length:** 150f @ 30fps

Configurable full-frame background with Screen Studio-style padding and a rounded, shadowed content frame. Accepts a solid color, gradient, image URL, or a live animated component as its fill — components themselves stay transparent and compose on top.

## Install

```bash
shadcn add @remocn/backdrop
```

Lands at `components/remocn/backdrop.tsx`.

## Props

| Prop | Type | Default |
|---|---|---|
| `fill` | `BackdropFill \| ReactNode` | — |
| `padding` | `number` | `4` |
| `radius` | `number` | `1` |
| `shadow` | `string` | `"0 20px 60px rgba(0,0,0,0.4)"` |
| `children` | `ReactNode` | — |

## Example

```tsx
<Backdrop fill="#0a0a0a" padding={6} radius={2}>
  <Typewriter text="Ship faster." />
</Backdrop>
```

## Use when

- You need a scene background — wrap every composition in `Backdrop` rather than hardcoding background colors on individual components.
- You want the Screen Studio floating-card look: colored surround with a padded, rounded, shadowed inner frame.
- The background itself should animate (pass a shader backdrop like `ShaderMeshGradient` as the `fill`).

## Don't use when

- You need an infinitely looping ambient background as a standalone track — use a shader backdrop directly and let the composition handle framing.
- You want a raw full-bleed color with no frame treatment — set `padding={0}` and `radius={0}`, or just set `backgroundColor` in the Remotion composition root.
- You're inside a transition presentation — transitions like `whip-pan` manage their own full-frame layout; nesting Backdrop inside them creates double-framing.
