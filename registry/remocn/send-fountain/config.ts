import {
  type ComponentConfig,
  FPS,
  groundControl,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const sendFountainConfig: ComponentConfig = {
  componentName: "SendFountain",
  importPath: "@/components/remocn/send-fountain",
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
      default: "Build a launch dashboard for the v2 release",
      description: "Prompt",
    },
    appTitle: {
      type: "text-content",
      default: "Launch board",
      description: "App title",
    },
    heroTitle: {
      type: "text-content",
      default: "Launch film",
      description: "Hero title",
    },
    statLabel: {
      type: "text-content",
      default: "Weekly active",
      description: "Stat label",
    },
    statDelta: {
      type: "text-content",
      default: "+18%",
      description: "Stat delta",
    },
    chartTitle: {
      type: "text-content",
      default: "Signups",
      description: "Chart title",
    },
    ctaLabel: {
      type: "text-content",
      default: "Publish",
      description: "Button",
    },
    stat: {
      type: "number",
      default: 47200,
      min: 0,
      max: 141600,
      step: 1,
      description: "Stat",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#ff5a1f",
      description: "Accent",
    },
    ground: groundControl(),
    ...sceneControls({ font: "Onest" }),
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
  durationInFrames: 144,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
