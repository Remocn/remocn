# Introducing Product placeholder

## Goal

Replace the existing multi-scene `introducing-product` template with a single-component placeholder while keeping the template visible and installable through the existing registry and documentation route.

## Design

- Keep one source file: `registry/remocn-templates/introducing-product/index.tsx`.
- Export `IntroducingProduct`, its minimal props type, and the preview `introducingProductConfig` from that file.
- Render a static full-frame placeholder with neutral copy: `Template placeholder`.
- Remove the scene modules, schema, timeline/types helpers, tests, and the dedicated Remotion Studio root.
- Point the preview registry at the config exported by `index.tsx`.
- Reduce the shadcn registry entry to the single component file.
- Update the docs to describe and demonstrate the placeholder rather than the removed production template API.
- Rebuild generated registry and preview-manifest artifacts.

## Verification

- TypeScript typecheck.
- Biome check for touched files.
- Registry and preview-manifest synchronization checks.
- Documentation/registry coverage tests.
