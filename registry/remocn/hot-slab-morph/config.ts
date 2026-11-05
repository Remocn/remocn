import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const hotSlabMorphConfig: ComponentConfig = {
  componentName: "HotSlabMorphDemo",
  importPath: "@/components/remocn/hot-slab-morph",
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
    lineA: {
      type: "text-content",
      default: "Start from a template",
      description: "Line a",
    },
    lineB: {
      type: "text-content",
      default: "or just describe it",
      description: "Line b",
    },
    prompt: {
      type: "text-content",
      default: "A 30-second launch film for our new editor",
      description: "Prompt",
    },
  },
  durationInFrames: 126,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
