type DocsSection = {
  /** What one component page in the section is, e.g. "transition". */
  kind?: string;
  /** A library with its own introduction pages, e.g. "Shaders". */
  library?: string;
  /** Title for the section's index page when "<title> for Remotion" reads badly. */
  hubTitle?: string;
  /** Suffix for the section's pages that are not components. */
  pageSuffix?: string;
};

export const DOCS_SEO_SECTIONS: Record<string, DocsSection> = {
  ai: { kind: "AI interface animation" },
  camera: { kind: "camera effect" },
  captions: { kind: "caption style", library: "Captions" },
  compositions: { kind: "composition" },
  craft: {
    hubTitle: "Motion design rules for Remotion videos",
    pageSuffix: "motion design for Remotion videos",
  },
  effects: { kind: "effect" },
  filters: { kind: "video filter", library: "Filters" },
  "graphic-looks": { kind: "graphic look" },
  guides: {
    hubTitle: "Remotion video guides",
    pageSuffix: "a Remotion video guide",
  },
  icons: { kind: "animated icon", library: "Animated icons" },
  layout: { kind: "layout component" },
  "logo-stings": { kind: "logo animation" },
  media: { kind: "media layout" },
  "motion-graphics": { kind: "motion graphic" },
  numbers: { kind: "number animation" },
  "product-scenes": { kind: "product scene" },
  shaders: { kind: "shader background", library: "Shaders" },
  social: { kind: "social video animation" },
  templates: { kind: "video template" },
  transitions: { kind: "transition" },
  typography: { kind: "text animation" },
  ui: { kind: "UI component", library: "UI primitives" },
  "ui-blocks": { kind: "UI block" },
};

const SHADER_PRESET_DEPTH = 4;
const MENTIONS_REMOTION = /remotion/i;
// A title this long is already a full question or claim ("How to turn app
// screenshots into a video"). The section suffix is there to qualify short
// nav-style titles like "Teaser"; on a problem page it buries the reader's
// words under a category name they may not know yet.
const FULL_SENTENCE_TITLE = 40;

type DocsSeoPage = {
  slug: string[];
  title: string;
  description?: string;
  component?: string;
  parentTitle?: string;
};

export function docsSeoTitle(page: DocsSeoPage): string {
  if (MENTIONS_REMOTION.test(page.title)) return page.title;
  const section = DOCS_SEO_SECTIONS[page.slug[0]];
  if (!section) return page.title;
  if (page.component && section.kind) {
    const isShaderPreset =
      page.slug[0] === "shaders" &&
      page.slug.length === SHADER_PRESET_DEPTH &&
      page.parentTitle;
    if (isShaderPreset) {
      return `${page.title}: ${page.parentTitle} shader preset for Remotion`;
    }
    return `${page.title}: Remotion ${section.kind}`;
  }
  if (section.library) return `${page.title}: ${section.library} for Remotion`;
  if (page.slug.length === 1) {
    return section.hubTitle ?? `${page.title} for Remotion`;
  }
  if (section.pageSuffix && page.title.length < FULL_SENTENCE_TITLE) {
    return `${page.title}: ${section.pageSuffix}`;
  }
  return page.title;
}

export function docsSeoDescription(page: DocsSeoPage): string | undefined {
  const { description, component } = page;
  if (!description || !component) return description;
  if (MENTIONS_REMOTION.test(description)) return description;
  const kind = DOCS_SEO_SECTIONS[page.slug[0]]?.kind ?? "component";
  const sentence = description.replace(/[.\s]+$/, "");
  return `${sentence}. A free, MIT-licensed Remotion ${kind}.`;
}
