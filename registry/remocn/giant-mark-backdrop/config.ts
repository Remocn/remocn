import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const giantMarkBackdropConfig: ComponentConfig = {
  componentName: "GiantMarkBackdrop",
  importPath: "@/components/remocn/giant-mark-backdrop",
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
    prompt: {
      type: "text-content",
      default: "Make a launch film for our v2 release",
      description: "Prompt",
    },
    placeholder: {
      type: "text-content",
      default: "Describe your launch film",
      description: "Placeholder",
    },
  },
  durationInFrames: 126,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
