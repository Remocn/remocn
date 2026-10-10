# Introducing Product: Remotion Studio controls

## Goal

Make the `introducing-product` template fully configurable from Remotion Studio without editing scene source files for routine customization.

## Studio entry

Add a permanent `src/remotion/introducing-product-root.tsx` entry that registers one `IntroducingProduct` composition. It keeps `defaultProps` as an inline object so Remotion Studio can save edits back to the entry file.

Open it with:

```bash
bunx remotion studio src/remotion/introducing-product-root.tsx
```

## Props architecture

Use one Zod-backed, nested props object rather than a flat list. The Studio panel groups controls by intent:

- `content`: product copy, feature cards, topics, logo, and screenshots;
- `theme`: background, text, accent and warm colors, typography, glow, and surface styling;
- `timeline`: duration of each of the ten scenes and global playback speed;
- one configuration object per scene for position, size, spacing, motion ranges, and scene-specific visual parameters.

The public component accepts partial configuration and deeply merges it with exported defaults. Installed templates therefore continue to render as-is while Studio receives a complete editable object.

## Timing and metadata

Scene durations are expressed in frames in `timeline`. The composition uses `calculateMetadata()` to derive the total duration from those values. Every `Series.Sequence` reads its duration from the normalized timeline.

FPS and canvas dimensions stay in composition metadata rather than scene props. This keeps Studio and rendered output deterministic while all creative timing remains editable.

## Motion controls

Easing values are exposed as named presets rather than functions, because functions cannot be represented in Studio props. Supported values are `linear`, `ease-in`, `ease-out`, `ease-in-out`, `snappy`, `smooth`, and `spring`. Scene code resolves the selected preset to a Remotion easing function.

Controls use bounded numeric ranges where values outside a useful range could make a scene disappear or create invalid metadata. Key transition points are expressed as normalized progress values so changing scene duration preserves the motion's relative structure.

## Interactivity

The Props panel is the source of truth for reusable values. Existing `Interactive.*` elements remain available for Studio selection where practical, but computed styles are driven by configuration rather than relying on source-code mutation. This keeps the same template configuration usable through Studio, CLI input props, and the registry package.

## Testing

- Unit-test deep default merging, timeline normalization, easing resolution, and total duration.
- Type-check the permanent Studio entry and every scene.
- Build the preview manifest and registry artifacts.
- Start Studio from the permanent entry and verify that the composition and nested Props controls load.
- Render representative frames after the refactor to catch visual regressions.
