import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const claudeCodeConfig: ComponentConfig = {
  componentName: "ClaudeCode",
  importPath: "@/components/remocn/claude-code",
  controls: {
    title: { type: "text", default: "Claude Code v2.0.0", label: "Title" },
    userName: { type: "text", default: "Remocn", label: "User name" },
    model: { type: "text", default: "Opus 4.8 • Max 20x", label: "Model" },
    cwd: { type: "text", default: "/users/remocn/code/apps", label: "Cwd" },
    placeholder: {
      type: "text",
      default: 'Try "edit <filepath> to ..."',
      label: "Placeholder",
    },
    prompt: {
      type: "text",
      default: "edit src/theme.ts to add a dark mode toggle",
      label: "Prompt",
    },
    accentColor: { type: "color", default: "#D97757", label: "Accent" },
    theme: {
      type: "select",
      default: "dark",
      options: ["light", "dark"],
      label: "Theme",
    },
    background: {
      type: "select",
      default: "surface",
      options: ["surface", "transparent"],
      label: "Background",
    },
  },
  durationInFrames: 160,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
