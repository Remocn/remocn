import {
  type ComponentConfig,
  FPS,
  groundControl,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const flankRollSwapConfig: ComponentConfig = {
  componentName: "FlankRollSwap",
  importPath: "@/components/remocn/flank-roll-swap",
  lists: {
    from: {
      default: ["Remocn", "Studio"],
      description: "From",
      min: 2,
      max: 2,
    },
    to: {
      default: ["Out now", "on remocn.dev"],
      description: "To",
      min: 2,
      max: 2,
    },
  },
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
    accentWord: {
      type: "text-content",
      default: "remocn.dev",
      description: "Accent word",
    },
    swapAt: {
      type: "number",
      default: 48,
      min: 12,
      max: 90,
      step: 1,
      description: "Swap at (frames)",
      hiddenFromList: false,
    },
    stagger: {
      type: "number",
      default: 1.2,
      min: 0,
      max: 4,
      step: 0.1,
      description: "Letter stagger",
      hiddenFromList: false,
    },
    accent: { type: "color", default: undefined, description: "Accent" },
    ground: groundControl(),
    ...sceneControls({ font: "Hanken Grotesk" }),
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
  durationInFrames: 126,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
