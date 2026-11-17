import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const hairlineOpenConfig: ComponentConfig = {
  componentName: "HairlineOpen",
  importPath: "@/components/remocn/hairline-open",
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
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    from: {
      type: "text-content",
      default: "Write the story",
      description: "From",
    },
    to: {
      type: "text-content",
      default: "Ship the film",
      description: "To",
    },
    italic: {
      type: "boolean",
      default: true,
      description: "Italic incoming line",
    },
    hold: {
      type: "number",
      default: 10,
      min: 0,
      max: 40,
      step: 1,
      description: "Hairline hold (frames)",
      hiddenFromList: false,
    },
    ...sceneControls({ font: "Instrument Serif", grain: true }),
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
  durationInFrames: 105,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
