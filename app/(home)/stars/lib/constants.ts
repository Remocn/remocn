import type { ControlConfig } from "@/lib/customizer-config";

export const INSTALL_COMMAND = "npx shadcn@latest add remocn/github-stars";

export const DOCS_HREF = "/docs/social/github-stars";

/** Scalar controls surfaced in the optional Customize panel (no array control). */
export const CUSTOM_CONTROLS: ControlConfig = {
  accentColor: { type: "color", default: "#ffbb00", label: "Accent" },
  theme: {
    type: "select",
    default: "light",
    options: ["light", "dark"],
    label: "Theme",
  },
  speed: {
    type: "number",
    default: 1,
    min: 1,
    max: 4,
    step: 0.25,
    label: "Speed",
  },
};
