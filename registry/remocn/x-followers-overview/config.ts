import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const xFollowersOverviewConfig: ComponentConfig = {
  componentName: "XFollowersOverview",
  importPath: "@/components/remocn/x-followers-overview",
  controls: {
    totalFollowers: {
      type: "number",
      default: 1709,
      min: 0,
      max: 10000000,
      step: 1,
      label: "Total followers",
    },
    handle: { type: "text", default: "remocn", label: "Handle" },
    avatarUrl: { type: "text", default: "/logo.svg", label: "Avatar URL" },
    accentColor: { type: "color", default: "#1d9bf0", label: "Accent" },
    orientation: {
      type: "select",
      default: "horizontal",
      options: ["horizontal", "vertical"],
      label: "Orientation",
    },
    // `speed` is appended from SHARED_CONTROLS in registry/__index__.tsx.
    // `notifications` is an array → not a control; preview uses SAMPLE_FOLLOWERS.
  },
  durationInFrames: 360,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#ffffff" },
};
