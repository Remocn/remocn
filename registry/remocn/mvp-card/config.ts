import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const mvpCardConfig: ComponentConfig = {
  componentName: "MvpCard",
  importPath: "@/components/remocn/mvp-card",
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
      default: "MVP",
      description: "Title",
    },
    kicker: {
      type: "text-content",
      default: "Most valuable player",
      description: "Kicker",
    },
    event: {
      type: "text-content",
      default: "Grand final 2026",
      description: "Event",
    },
    role: {
      type: "text-content",
      default: "Carry",
      description: "Role",
    },
    number: {
      type: "text-content",
      default: "01",
      description: "Number",
    },
    stagger: {
      type: "number",
      default: 8,
      min: 0,
      max: 20,
      step: 1,
      description: "Stat stagger",
      hiddenFromList: false,
    },
    countDuration: {
      type: "number",
      default: 22,
      min: 6,
      max: 60,
      step: 1,
      description: "Count length (frames)",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ...sceneControls({ font: "Antonio" }),
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
