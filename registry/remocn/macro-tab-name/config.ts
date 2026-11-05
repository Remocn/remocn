import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const macroTabNameConfig: ComponentConfig = {
  componentName: "MacroTabName",
  importPath: "@/components/remocn/macro-tab-name",
  controls: {
    theme: {
      type: "enum",
      default: "dark",
      variants: {
        dark: {},
        light: {},
      },
      description: "Theme",
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    name: {
      type: "text-content",
      default: "Launch Assets",
      description: "Name",
    },
    docMeta: {
      type: "text-content",
      default: "Edited 2 min ago · 14 files",
      description: "Doc meta",
    },
  },
  durationInFrames: 108,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
