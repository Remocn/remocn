import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const xFollowCardConfig: ComponentConfig = {
  componentName: "XFollowCard",
  importPath: "@/components/remocn/x-follow-card",
  controls: {
    name: {
      type: "text-content",
      default: "remocn",
      description: "Name",
    },
    handle: {
      type: "text-content",
      default: "remocn",
      description: "Handle",
    },
    bio: {
      type: "text-content",
      default:
        "Production-ready components for Remotion - text animations, backgrounds, transitions, UI blocks, and full scene compositions",
      description: "Bio",
    },
    avatarUrl: {
      type: "text-content",
      default: "/logo.svg",
      description: "Avatar URL",
    },
    coverUrl: {
      type: "text-content",
      default: "/imgs/x-cover.png",
      description: "Cover URL",
    },
    location: {
      type: "text-content",
      default: "Ukraine",
      description: "Location",
    },
    website: {
      type: "text-content",
      default: "remocn.dev",
      description: "Website",
    },
    joined: {
      type: "text-content",
      default: "January 2024",
      description: "Joined",
    },
    verified: {
      type: "boolean",
      default: true,
      description: "Verified",
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
  durationInFrames: 165,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#f5f7f9" },
};
