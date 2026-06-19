import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const xFollowCardConfig: ComponentConfig = {
  componentName: "XFollowCard",
  importPath: "@/components/remocn/x-follow-card",
  controls: {
    name: { type: "text", default: "remocn", label: "Name" },
    handle: { type: "text", default: "remocn", label: "Handle" },
    bio: {
      type: "text",
      default:
        "Production-ready components for Remotion - text animations, backgrounds, transitions, UI blocks, and full scene compositions",
      label: "Bio",
    },
    avatarUrl: { type: "text", default: "/logo.svg", label: "Avatar URL" },
    coverUrl: {
      type: "text",
      default: "/imgs/x-cover.png",
      label: "Cover URL",
    },
    location: { type: "text", default: "Ukraine", label: "Location" },
    website: { type: "text", default: "remocn.dev", label: "Website" },
    joined: { type: "text", default: "January 2024", label: "Joined" },
    verified: { type: "boolean", default: true, label: "Verified" },
    accentColor: { type: "color", default: "#1d9bf0", label: "Accent" },
    orientation: {
      type: "select",
      default: "horizontal",
      options: ["horizontal", "vertical"],
      label: "Orientation",
    },
  },
  durationInFrames: 165,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#f5f7f9" },
};
