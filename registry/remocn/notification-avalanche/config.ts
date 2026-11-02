import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const notificationAvalancheConfig: ComponentConfig = {
  componentName: "NotificationAvalanche",
  importPath: "@/components/remocn/notification-avalanche",
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
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    clearLabel: {
      type: "text-content",
      default: "All caught up.",
      description: "Clear label",
    },
    clearSubLabel: {
      type: "text-content",
      default: "remocn sorted 128 notifications",
      description: "Clear sub label",
    },
    counterLabel: {
      type: "text-content",
      default: "unread before 10 am",
      description: "Counter label",
    },
    surface: {
      type: "enum",
      default: "phone",
      variants: {
        phone: {},
        desktop: {},
      },
      description: "Surface",
    },
    total: {
      type: "number",
      default: 128,
      min: 0,
      max: 384,
      step: 1,
      description: "Total",
      hiddenFromList: false,
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
