import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const ringBurstConfig: ComponentConfig = {
  componentName: "RingBurst",
  importPath: "@/components/remocn/ring-burst",
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
      default: "Before.",
      description: "From",
    },
    to: {
      type: "text-content",
      default: "remocn",
      description: "To",
    },
    expand: {
      type: "number",
      default: 32,
      min: 8,
      max: 80,
      step: 1,
      description: "Ring expand (frames)",
      hiddenFromList: false,
    },
    stagger: {
      type: "number",
      default: 4,
      min: 0,
      max: 12,
      step: 1,
      description: "Ring stagger (frames)",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ...sceneControls({ font: "Fraunces", grain: true }),
    // After sceneControls so its 0-default delay doesn't replace this one.
    delay: {
      type: "number",
      default: 20,
      min: 0,
      max: 60,
      step: 1,
      description: "Delay",
      hiddenFromList: false,
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
  durationInFrames: 100,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
