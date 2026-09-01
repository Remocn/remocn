# Introducing Product template

## Goal

Add Templates as a first-class documentation and registry category for complete Remotion videos that can be installed and used as-is. Seed the category with an installable placeholder named `introducing-product`; its visual implementation will be replaced after the reference video is supplied.

## Structure

- Add a dedicated `registry/remocn-templates` namespace and include it from the root registry.
- Store the template source and preview config under `registry/remocn-templates/introducing-product`.
- Install the template to `components/remocn/templates/introducing-product.tsx`.
- Expose the template to the existing preview loader so documentation can render it in a Remotion player.

## Documentation

- Add a `Templates` docs tab immediately after `Filters`.
- Route the tab to `/docs/templates/introducing-product`.
- Give Templates its own sidebar tree with one item, `Introducing Product`.
- Document the live preview, install command, and minimal composition usage.

## Placeholder composition

The initial scene is a self-contained 1280×720, 30fps Remotion component with restrained placeholder styling and deterministic frame-driven motion. It accepts basic product copy and accent-color props so it remains a valid reusable template before the reference-specific implementation lands.

## Verification

- Extend docs-tab unit tests for Templates routing, isolation, ordering, and stable tree IDs.
- Build registry artifacts and the preview manifest.
- Run focused tests, typecheck, lint, and registry consistency checks.

## Implementation plan

1. Add the template source, config, registry definition, and root registry include.
2. Register the template with the documentation preview loader.
3. Add Templates content metadata and the first documentation page.
4. Extend docs tab/tree plumbing through the server layout and client shell.
5. Generate derived artifacts and verify the feature.
