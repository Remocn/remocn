# ascii-dissolve

**Tier:** `remocn` (transition) · **Vibe:** retro · **Natural length:** 40f @ 30fps

Dissolve one scene into the next through a drifting field of monospace ASCII glyphs. The outgoing scene blurs out under a rising grid of characters, then the incoming scene resolves cell by cell. Content-agnostic.

## Install

```bash
shadcn add @remocn/ascii-dissolve
```

Lands at `components/remocn/ascii-dissolve.tsx`.

## Props

`asciiDissolve(props)` returns a `TransitionPresentation`.

| Prop | Type | Default |
|---|---|---|
| `colorBack` | `string` | `"#0d0d10"` |
| `colorFront` | `string` | `"rgba(242,242,242,0.6)"` |
| `cellSize` | `number` | `22` |
| `ramp` | `string` | `" .:-=+*#%@"` |
| `accentColor` | `string` | — |
| `accentDensity` | `number` | `0.05` |

## Example

```tsx
<TransitionSeries.Transition
  timing={linearTiming({ durationInFrames: 40 })}
  presentation={asciiDissolve({ colorBack: "#0d0d10", cellSize: 22 })}
/>
```

## Use when

- The video has a retro, terminal, or print aesthetic — the text-grid dissolve reads as CRT or risograph texture.
- Content is dev-tool or teletype in tone and a monospace-glyph cut fits the brand.
- The cut needs to stay content-agnostic — it works between any two scenes with no color matching required.

## Don't use when

- The tone is soft or organic — use `grain-dissolve` or `perlin-dissolve` for a gentler texture instead.
- You need a camera move rather than a dissolve — use `whip-pan` or `push-through`.
- The brand is clean and minimal — the character grid reads as deliberately rough, not polished.
