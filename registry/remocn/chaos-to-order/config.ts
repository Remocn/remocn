import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const chaosToOrderConfig: ComponentConfig = {
  componentName: "ChaosToOrder",
  importPath: "@/components/remocn/chaos-to-order",
  lists: {
    items: {
      default: [
        "#launch-war-room",
        "Q4 roadmap v7 FINAL.xlsx",
        "Inbox",
        "Launch plan (draft 3)",
        "Pricing · Kitebase",
        "fix onboarding!!",
        "Payment failed",
        "who owns billing??",
        "Standup in 2 min",
        "14 new comments",
        "ship by Fri???",
        "Build #482 failed",
        "call Maya re: assets",
        "3 unread in #design",
      ],
      description: "Items",
    },
  },
  controls: {
    theme: {
      type: "enum",
      default: "dark",
      variants: {
        light: {},
        dark: {},
      },
      description: "Theme",
    },
    workspace: {
      type: "text-content",
      default: "remocn",
      description: "Workspace",
    },
    hold: {
      type: "number",
      default: 56,
      min: 40,
      max: 100,
      step: 1,
      description: "Hold (frames)",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ...sceneControls({ font: "Inter" }),
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
  durationInFrames: 120,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
