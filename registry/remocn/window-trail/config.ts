import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const windowTrailConfig: ComponentConfig = {
  componentName: "WindowTrail",
  importPath: "@/components/remocn/window-trail",
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
    from: {
      type: "text-content",
      default: "Old look.",
      description: "From",
    },
    text: {
      type: "text-content",
      default: "New look, same product.",
      description: "Text",
    },
    tagline: {
      type: "text-content",
      default: "Repainted in one render.",
      description: "Tagline",
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
