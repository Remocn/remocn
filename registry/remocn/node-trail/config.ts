import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const nodeTrailConfig: ComponentConfig = {
  componentName: "NodeTrail",
  importPath: "@/components/remocn/node-trail",
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
    placeholder: {
      type: "text-content",
      default: "Describe your launch",
      description: "Placeholder",
    },
    promptLabel: {
      type: "text-content",
      default: "Prompt",
      description: "Prompt label",
    },
    headline: {
      type: "text-content",
      default: "From one prompt to every screen.",
      description: "Headline",
    },
    boardName: {
      type: "text-content",
      default: "launch-film.flow",
      description: "Board name",
    },
  },
  durationInFrames: 193,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
