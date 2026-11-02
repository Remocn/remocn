import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const acronymExpandConfig: ComponentConfig = {
  componentName: "AcronymExpand",
  importPath: "@/components/remocn/acronym-expand",
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
    short: {
      type: "text-content",
      default: "MCP",
      description: "Short",
    },
    full: {
      type: "text-content",
      default: "Model Context Protocol",
      description: "Full",
    },
    eyebrow: {
      type: "text-content",
      default: "Now in remocn",
      description: "Eyebrow",
    },
    subhead: {
      type: "text-content",
      default: "Your agent browses, installs and edits every component.",
      description: "Subhead",
    },
    speed: {
      type: "number",
      default: 1,
      min: 0.25,
      max: 4,
      step: 0.25,
      description: "Speed",
      hiddenFromList: false,
    },
  },
  durationInFrames: 120,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
