import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const browserExtensionConfig: ComponentConfig = {
  componentName: "BrowserExtension",
  importPath: "@/components/remocn/browser-extension",
  controls: {
    theme: {
      type: "enum",
      default: "light",
      variants: {
        light: {},
        dark: {},
      },
      description: "Theme",
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    url: {
      type: "text-content",
      default: "quarry.blog/notes/why-small-teams-ship-faster",
      description: "Url",
    },
    siteName: {
      type: "text-content",
      default: "Quarry Journal",
      description: "Site name",
    },
    kicker: {
      type: "text-content",
      default: "Notes · 6 min read",
      description: "Kicker",
    },
    title: {
      type: "text-content",
      default: "Why small teams ship faster",
      description: "Title",
    },
    dek: {
      type: "text-content",
      default: "On the short loop between a decision and a deploy.",
      description: "Dek",
    },
    author: {
      type: "text-content",
      default: "Priya Raman",
      description: "Author",
    },
    date: {
      type: "text-content",
      default: "Oct 14, 2026",
      description: "Date",
    },
    extensionName: {
      type: "text-content",
      default: "remocn",
      description: "Extension name",
    },
  },
  durationInFrames: 200,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
