import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const yourNameHereConfig: ComponentConfig = {
  componentName: "YourNameHere",
  importPath: "@/components/remocn/your-name-here",
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
    lead: {
      type: "text-content",
      default: "A launch film for",
      description: "Lead",
    },
    brand: {
      type: "text-content",
      default: "remocn",
      description: "Brand",
    },
    slot: {
      type: "text-content",
      default: "yourProduct",
      description: "Slot",
    },
    end: {
      type: "text-content",
      default: ".",
      description: "End",
    },
    note: {
      type: "text-content",
      default: "Swap one prop. The film is yours.",
      description: "Note",
    },
    stagger: {
      type: "number",
      default: 3,
      min: 0,
      max: 12,
      step: 1,
      description: "Word stagger",
      hiddenFromList: false,
    },
    accent: { type: "color", default: undefined, description: "Accent" },
    ...sceneControls({ font: "Lexend" }),
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
  durationInFrames: 180,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
