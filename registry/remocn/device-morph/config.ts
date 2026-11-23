import {
  type ComponentConfig,
  FPS,
  groundControl,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const deviceMorphConfig: ComponentConfig = {
  componentName: "DeviceMorph",
  importPath: "@/components/remocn/device-morph",
  controls: {
    theme: {
      type: "enum",
      default: "light",
      variants: {
        light: {},
        dark: {},
      },
      description: "Theme",
    },
    brand: {
      type: "text-content",
      default: "remocn",
      description: "Brand",
    },
    greeting: {
      type: "text-content",
      default: "Good morning, Maya",
      description: "Greeting",
    },
    ctaLabel: {
      type: "text-content",
      default: "New video",
      description: "Button label",
    },
    reverse: {
      type: "boolean",
      default: false,
      description: "Reverse",
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
  durationInFrames: 205,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
