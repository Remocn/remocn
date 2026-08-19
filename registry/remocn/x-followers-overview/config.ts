import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const xFollowersOverviewConfig: ComponentConfig = {
  componentName: "XFollowersOverview",
  importPath: "@/components/remocn/x-followers-overview",
  controls: {
    totalFollowers: {
      type: "number",
      min: 0,
      step: 1,
      default: 1709,
      description: "Total followers",
      hiddenFromList: false,
    },
    handle: {
      type: "text-content",
      default: "remocn",
      description: "Handle",
    },
    avatarUrl: {
      type: "text-content",
      default: "/logo.svg",
      description: "Avatar URL",
    },
    accentColor: {
      type: "color",
      default: "#1d9bf0",
      description: "Accent",
    },
    orientation: {
      type: "enum",
      default: "horizontal",
      variants: {
        horizontal: {},
        vertical: {},
      },
      description: "Orientation",
    },
  },
  durationInFrames: 360,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#ffffff" },
};
