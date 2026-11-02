import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const glowBornCardConfig: ComponentConfig = {
  componentName: "GlowBornCard",
  importPath: "@/components/remocn/glow-born-card",
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
      default: "#45f0d6",
      description: "Accent",
    },
    primary: {
      type: "color",
      default: "#3B5BFD",
      description: "Primary",
    },
    before: {
      type: "text-content",
      default: "Or import a scene from",
      description: "Before",
    },
    after: {
      type: "text-content",
      default: "your repo",
      description: "After",
    },
    title: {
      type: "text-content",
      default: "Import from repository",
      description: "Title",
    },
    label: {
      type: "text-content",
      default: "Repository",
      description: "Label",
    },
    value: {
      type: "text-content",
      default: "lumen-labs/launch",
      description: "Value",
    },
    hint: {
      type: "text-content",
      default: "Public or private, any branch",
      description: "Hint",
    },
    branch: {
      type: "text-content",
      default: "main · 214 commits · 3h ago",
      description: "Branch",
    },
  },
  durationInFrames: 136,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
