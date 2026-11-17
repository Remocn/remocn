import {
  type ComponentConfig,
  FPS,
  groundControl,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const inviteTeamConfig: ComponentConfig = {
  componentName: "InviteTeam",
  importPath: "@/components/remocn/invite-team",
  lists: {
    emails: {
      default: ["maya@kitebase.io", "leo@kitebase.io", "priya@kitebase.io"],
      description: "Emails",
    },
  },
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
    pageTitle: {
      type: "text-content",
      default: "Projects",
      description: "Page title",
    },
    fieldLabel: {
      type: "text-content",
      default: "Email addresses",
      description: "Field label",
    },
    doneLabel: {
      type: "text-content",
      default: "Invites sent",
      description: "Done label",
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ground: groundControl(),
    ...sceneControls({ font: "Hanken Grotesk" }),
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
