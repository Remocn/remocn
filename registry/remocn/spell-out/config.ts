import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const spellOutConfig: ComponentConfig = {
  componentName: "SpellOut",
  importPath: "@/components/remocn/spell-out",
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
    name: {
      type: "text-content",
      default: "remocn",
      description: "Name",
    },
    line: {
      type: "text-content",
      default: "Say it once. Remember it.",
      description: "Line",
    },
    stagger: {
      type: "number",
      default: 8,
      min: 2,
      max: 16,
      step: 1,
      description: "Letter stagger",
      hiddenFromList: false,
    },
    hold: {
      type: "number",
      default: 14,
      min: 0,
      max: 40,
      step: 1,
      description: "Hold (frames)",
      hiddenFromList: false,
    },
    accent: { type: "color", default: undefined, description: "Accent" },
    ...sceneControls({ font: "Nunito" }),
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
  durationInFrames: 150,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
