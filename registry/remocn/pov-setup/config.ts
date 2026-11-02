import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const povSetupConfig: ComponentConfig = {
  componentName: "PovSetup",
  importPath: "@/components/remocn/pov-setup",
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
    label: {
      type: "text-content",
      default: "POV:",
      description: "Label",
    },
    setup: {
      type: "text-content",
      default: "you shipped the launch video before standup",
      description: "Setup",
    },
    lead: {
      type: "text-content",
      default: "and it",
      description: "Lead",
    },
    punch: {
      type: "text-content",
      default: "slaps.",
      description: "Punch",
    },
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
  durationInFrames: 125,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
