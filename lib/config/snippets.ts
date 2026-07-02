import { LAVENDER, MINT, PEACH } from "@/config/site";

// ---------------------------------------------------------------------------
// Hero code block
// ---------------------------------------------------------------------------

/** Shown inside the hero's glass-code-block player — the real remocn flow. */
export const HERO_CODE = `// npx shadcn@latest add remocn/soft-blur-in remocn/mesh-gradient-bg
import { AbsoluteFill } from "remotion";
import { SoftBlurIn } from "@/components/remocn/soft-blur-in";
import { MeshGradientBg } from "@/components/remocn/mesh-gradient-bg";

export function LaunchScene() {
  return (
    <AbsoluteFill>
      <MeshGradientBg />
      <SoftBlurIn text="Ship your launch video" />
    </AbsoluteFill>
  );
}`;

// ---------------------------------------------------------------------------
// Get-started steps
// ---------------------------------------------------------------------------

export type Step = {
  n: number;
  title: string;
  description: string;
  command: string;
  component?: string;
  /** Pastel accent that differentiates this step from its neighbours. */
  accent: string;
};

export const START: Step = {
  n: 1,
  title: "Start with Remotion",
  description:
    "Already have a Remotion project? Skip ahead. Otherwise scaffold one in seconds.",
  command: "npx create-video@latest",
  accent: PEACH,
};

export const INIT: Step = {
  n: 2,
  title: "Set up shadcn",
  description:
    "Run the shadcn init once so the CLI knows where to drop component files in your project.",
  command: "npx shadcn@latest init",
  accent: MINT,
};

export const ADD: Step = {
  n: 3,
  title: "Add a component",
  description:
    "Pull any primitive or composition straight into your project with the shadcn CLI — the code lands in your repo, yours to tweak.",
  command: "npx shadcn@latest add remocn/soft-blur-in",
  component: "soft-blur-in",
  accent: LAVENDER,
};

export const RENDER: Step = {
  n: 4,
  title: "Render your video",
  description:
    "Drop the component into a composition and export an mp4 — no editor required.",
  command: "npx remotion render",
  accent: PEACH,
};

/** A taste of what `remocn/<name>` pulls in — fills the featured card. */
export const SAMPLE_COMPONENTS = [
  "soft-blur-in",
  "shimmer-sweep",
  "grain-dissolve",
  "whip-pan",
];

// ---------------------------------------------------------------------------
// Interactive-code section defaults
// ---------------------------------------------------------------------------

/** Default prop values for the typewriter component live preview. */
export const TYPEWRITER_DEFAULTS = {
  text: "Ship it in React",
  fontSize: 104,
  color: "#171717",
  fontWeight: 700,
  cursor: true,
};
