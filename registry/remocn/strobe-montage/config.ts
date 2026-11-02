import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const strobeMontageConfig: ComponentConfig = {
  componentName: "StrobeMontage",
  importPath: "@/components/remocn/strobe-montage",
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
    lead: {
      type: "text-content",
      default: "Six weekends",
      description: "Lead",
    },
    accentWord: {
      type: "text-content",
      default: "of making.",
      description: "Accent word",
    },
    accentMark: {
      type: "text-content",
      default: "?",
      description: "Accent mark",
    },
    prompt: {
      type: "text-content",
      default: "A 30-second film for our 2.0 release",
      description: "Prompt",
    },
    file: {
      type: "text-content",
      default: "launch-notes.md",
      description: "File",
    },
  },
  durationInFrames: 128,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
