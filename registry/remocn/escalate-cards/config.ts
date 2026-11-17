import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const escalateCardsConfig: ComponentConfig = {
  componentName: "EscalateCards",
  importPath: "@/components/remocn/escalate-cards",
  lists: {
    words: {
      default: ["ONE", "CODEBASE", "EVERY", "LAUNCH"],
      description: "Words",
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
    date: {
      type: "text-content",
      default: "OCTOBER 30",
      description: "Date",
    },
    firstBeat: {
      type: "number",
      default: 26,
      min: 0,
      max: 78,
      step: 1,
      description: "First beat",
      hiddenFromList: false,
    },
    accel: {
      type: "number",
      default: 0.6,
      min: 0,
      max: 1.8,
      step: 0.01,
      description: "Accel",
      hiddenFromList: false,
    },
    dateDelay: {
      type: "number",
      default: 14,
      min: 0,
      max: 60,
      step: 1,
      description: "Date delay (frames)",
      hiddenFromList: false,
    },
    push: {
      type: "number",
      default: 0.045,
      min: 0,
      max: 0.2,
      step: 0.005,
      description: "Climax push",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ...sceneControls({ font: "Oswald" }),
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
  durationInFrames: 130,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
