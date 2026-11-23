import {
  type ComponentConfig,
  FPS,
  groundControl,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const waitlistSwarmConfig: ComponentConfig = {
  componentName: "WaitlistSwarm",
  importPath: "@/components/remocn/waitlist-swarm",
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
    label: {
      type: "text-content",
      default: "on the waitlist",
      description: "Label",
    },
    value: {
      type: "number",
      default: 12480,
      min: 0,
      max: 37440,
      step: 1,
      description: "Value",
      hiddenFromList: false,
    },
    count: {
      type: "number",
      default: 760,
      min: 0,
      max: 2280,
      step: 1,
      description: "Count",
      hiddenFromList: false,
    },
    dotSize: {
      type: "number",
      default: 1,
      min: 0.5,
      max: 2,
      step: 0.05,
      description: "Dot size",
      hiddenFromList: false,
    },
    pulse: {
      type: "boolean",
      default: true,
      description: "Pulse",
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ground: groundControl(),
    ...sceneControls({ font: "Bricolage Grotesque" }),
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
  // Does not hold 60 fps in the browser yet (`audit:playback`: script).
  previewFps: 30,
  compositionWidth: W,
  compositionHeight: H,
};
