import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const liquidWordConfig: ComponentConfig = {
  componentName: "LiquidWord",
  importPath: "@/components/remocn/liquid-word",
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
      default: "draft",
      description: "From",
    },
    to: {
      type: "text-content",
      default: "shipped",
      description: "To",
    },
    meltAt: {
      type: "number",
      default: 12,
      min: 0,
      max: 60,
      step: 1,
      description: "Melt at (frame)",
      hiddenFromList: false,
    },
    stagger: {
      type: "number",
      default: 3,
      min: 0,
      max: 12,
      step: 1,
      description: "Letter stagger",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ...sceneControls({ font: "Sora", grain: true }),
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
  durationInFrames: 145,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
