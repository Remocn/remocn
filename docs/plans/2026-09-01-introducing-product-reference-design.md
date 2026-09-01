# Introducing Product reference implementation

## Goal

Replace the initial `introducing-product` placeholder with a complete, editable Remotion template inspired by the supplied 53.2-second Learnist reference. Preserve its pacing and motion language without copying Learnist branding or bundling its audio.

## Format

- 1280×720 at 30fps.
- Approximately 53 seconds.
- No bundled audio. The visuals retain the reference rhythm and can receive audio in a later iteration.
- Deterministic, frame-driven animation only.

## Visual direction

The template alternates between a dark product world and a light conceptual world. The dark world uses restrained violet and warm-orange floor light, oversized kinetic typography, perspective UI panels, and fine grid lines. The light world uses soft violet/orange orbs, crisp black type, and layered translucent shapes. The ending returns to the dark world for an orbital brand reveal.

## Timeline

1. Hook — oversized statement resolves to a centered line.
2. Contrast — a second line pushes through with blur and scale.
3. Command — a glowing command field types a product-learning prompt.
4. Brand reveal — logo fallback and product name settle in.
5. Product UI — a perspective workspace panel enters and holds.
6. Value counter — a light scene builds a “faster” metric through nested pills.
7. Feature walkthrough — dashboard, detail, and activity panels move through a shared 3D stage.
8. Card montage — multiple learning cards gather into one system.
9. Learning loop — light kinetic copy and a looping orb explain the product promise.
10. Topic cascade — editable topic names cycle rapidly.
11. Outro — the brand mark appears among orbiting accent spheres and resolves to a final lockup.

## Component architecture

The registry item installs a directory while keeping the public import stable:

```text
components/remocn/templates/introducing-product/
  index.tsx
  scenes.tsx
  types.ts
```

`index.tsx` owns the timeline and public API. `scenes.tsx` contains the visual scenes and reusable internal primitives. `types.ts` holds the editable content contract and defaults.

## Editable content

The public component accepts product name, tagline, command copy, benefit copy, metric, feature cards, topic names, accent colors, optional logo URL, and optional screenshot URLs. Missing assets fall back to generated UI mockups and a text-based brand mark, so the installed template renders as-is.

Primitive fields remain available in the docs customizer. Arrays and asset URLs are documented for code editing without forcing complex URL state into the preview controls.

## Error handling

- Empty arrays fall back to the bundled default content.
- Missing logo or screenshot URLs use deterministic generated fallbacks.
- Text is clamped and laid out defensively to avoid overflow.
- All motion uses Remotion frame APIs; no timers or nondeterministic randomness.

## Verification

- Unit-test timeline duration, scene boundaries, and fallback normalization.
- Run docs metadata tests, typecheck, and production build.
- Rebuild the registry artifact and preview manifest.
- Render the template to MP4 and inspect a contact sheet at the major scene boundaries against the reference.

## Implementation plan

1. Define the content contract, defaults, and timeline constants.
2. Build the shared dark/light backdrops, typography, UI mockups, counter, and orbital primitives.
3. Compose the eleven scenes with local frame timing.
4. Replace the registry item files and update preview configuration/documentation.
5. Add timeline tests and regenerate artifacts.
6. Render and visually compare the result, then make one focused correction pass.
