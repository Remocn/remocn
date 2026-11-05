import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const inviteTeamConfig: ComponentConfig = {
  componentName: "InviteTeam",
  importPath: "@/components/remocn/invite-team",
  controls: {
    theme: {
      type: "enum",
      default: "light",
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
    role: {
      type: "text-content",
      default: "Editor",
      description: "Role",
    },
    workspace: {
      type: "text-content",
      default: "Kitebase",
      description: "Workspace",
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
  durationInFrames: 215,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
