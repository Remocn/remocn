import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const layoverConfig: ComponentConfig = {
  componentName: "Layover",
  importPath: "@/components/remocn/layover",
  lists: {
    stops: {
      default: ["w", "every"],
      description: "Stops",
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
    from: {
      type: "text-content",
      default: "Write it",
      description: "From",
    },
    word: {
      type: "text-content",
      default: "here.",
      description: "Word",
    },
    to: {
      type: "text-content",
      default: "Plays",
      description: "To",
    },
    leg: {
      type: "number",
      default: 22,
      min: 6,
      max: 60,
      step: 1,
      description: "Hop (frames)",
      hiddenFromList: false,
    },
    hold: {
      type: "number",
      default: 20,
      min: 0,
      max: 60,
      step: 1,
      description: "Hold (frames)",
      hiddenFromList: false,
    },
    accent: { type: "color", default: undefined, description: "Accent" },
    ...sceneControls({ font: "Red Hat Display" }),
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
  durationInFrames: 175,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
