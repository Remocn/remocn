import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const transitLinesConfig: ComponentConfig = {
  componentName: "TransitLines",
  importPath: "@/components/remocn/transit-lines",
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
      default: "remocn",
      description: "Title",
    },
    kicker: {
      type: "text-content",
      default: "Next stop",
      description: "Kicker",
    },
    stagger: {
      type: "number",
      default: 4,
      min: 0,
      max: 16,
      step: 1,
      description: "Line stagger",
      hiddenFromList: false,
    },
    draw: {
      type: "number",
      default: 38,
      min: 10,
      max: 48,
      step: 1,
      description: "Draw (frames)",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ...sceneControls({ font: "Instrument Sans", grain: true }),
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
  durationInFrames: 135,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
