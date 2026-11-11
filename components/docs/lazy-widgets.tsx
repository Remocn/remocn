"use client";

import dynamic from "next/dynamic";

/**
 * Docs widgets that carry Remotion, the player, the registry index or example
 * scenes. Every MDX file is imported up front, so a static import of any of
 * these puts its code into the chunks every docs page loads. Imported through
 * `next/dynamic` instead, a widget's code loads only on pages that render it.
 * Server rendering stays on, so the HTML is the same; only hydration of the
 * widget waits for its chunk.
 *
 * Server components import the widgets from here, not from their own files.
 */

export const ComponentPreview = dynamic(() =>
  import("./component-preview").then((m) => m.ComponentPreview),
);

export const ComponentExample = dynamic(() =>
  import("./component-example").then((m) => m.ComponentExample),
);

export const UiComponentPreview = dynamic(() =>
  import("./ui-component-preview").then((m) => m.UiComponentPreview),
);

export const BlockPreview = dynamic(() =>
  import("./block-preview").then((m) => m.BlockPreview),
);

export const IconsGallery = dynamic(() =>
  import("./icons-gallery").then((m) => m.IconsGallery),
);

export const ComponentCard = dynamic(() =>
  import("./component-card").then((m) => m.ComponentCard),
);

export const ShaderPresetCard = dynamic(() =>
  import("./shader-preset-card").then((m) => m.ShaderPresetCard),
);

export const CategoryBrowser = dynamic(() =>
  import("./index/category/category-browser").then((m) => m.CategoryBrowser),
);

export const TemplatePoster = dynamic(() =>
  import("./index/templates/template-poster").then((m) => m.TemplatePoster),
);

export const RegistryHeroPlayer = dynamic(() =>
  import("./index/libraries/registry-hero-player").then(
    (m) => m.RegistryHeroPlayer,
  ),
);

export const LibraryGrid = dynamic(() =>
  import("./index/libraries/library-grid").then((m) => m.LibraryGrid),
);

export const CaptionHero = dynamic(() =>
  import("./index/libraries/caption-hero").then((m) => m.CaptionHero),
);

export const FilterHero = dynamic(() =>
  import("./index/libraries/filter-hero").then((m) => m.FilterHero),
);
