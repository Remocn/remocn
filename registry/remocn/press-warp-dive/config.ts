import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const pressWarpDiveConfig: ComponentConfig = {
  componentName: "PressWarpDiveDemo",
  importPath: "@/components/remocn/press-warp-dive",
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
    heading: {
      type: "text-content",
      default: "What are we launching?",
      description: "Heading",
    },
    prompt: {
      type: "text-content",
      default: "A 30-second launch film for our new editor",
      description: "Prompt",
    },
    headingB: {
      type: "text-content",
      default: "Your film is ready",
      description: "Heading b",
    },
    title: {
      type: "text-content",
      default: "Launch film, v2",
      description: "Title",
    },
  },
  durationInFrames: 138,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
