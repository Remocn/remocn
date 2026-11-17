import {
  type ComponentConfig,
  FPS,
  groundControl,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const nodeTrailConfig: ComponentConfig = {
  componentName: "NodeTrail",
  importPath: "@/components/remocn/node-trail",
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
    prompt: {
      type: "text-content",
      default: "A launch film for v2",
      description: "Prompt",
    },
    placeholder: {
      type: "text-content",
      default: "Describe your launch",
      description: "Placeholder",
    },
    promptLabel: {
      type: "text-content",
      default: "Prompt",
      description: "Prompt label",
    },
    headline: {
      type: "text-content",
      default: "From one prompt to every screen.",
      description: "Headline",
    },
    boardName: {
      type: "text-content",
      default: "launch-film.flow",
      description: "Board name",
    },
    draw: {
      type: "number",
      default: 22,
      min: 10,
      max: 60,
      step: 1,
      description: "Edge draw (frames)",
      hiddenFromList: false,
    },
    pause: {
      type: "number",
      default: 10,
      min: 0,
      max: 40,
      step: 1,
      description: "Node hold (frames)",
      hiddenFromList: false,
    },
    motionBlur: {
      type: "boolean",
      default: true,
      description: "Motion blur",
    },
    accent: { type: "color", default: undefined, description: "Accent" },
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
  durationInFrames: 193,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
