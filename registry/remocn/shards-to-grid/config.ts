import {
  type ComponentConfig,
  FPS,
  groundControl,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const shardsToGridConfig: ComponentConfig = {
  componentName: "ShardsToGrid",
  importPath: "@/components/remocn/shards-to-grid",
  lists: {
    labels: {
      default: ["Motion", "Type", "Sound", "Play reel", "Brand"],
      description: "Labels",
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
    title: {
      type: "text-content",
      default: "Launch v1",
      description: "Title",
    },
    status: {
      type: "text-content",
      default: "Assembling",
      description: "Status",
    },
    headline: {
      type: "text-content",
      default: "Every frame, written in code.",
      description: "Headline",
    },
    ctaLabel: {
      type: "text-content",
      default: "Publish",
      description: "Button label",
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ground: groundControl(),
    ...sceneControls({ font: "Geist" }),
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
  durationInFrames: 144,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
