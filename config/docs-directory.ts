export const DOCS_MENU_HREF = "/docs/getting-started/introduction";

export const START_HERE = [
  {
    href: "/docs/getting-started/introduction",
    description: "What remocn is and how the pieces fit",
  },
  {
    href: "/docs/getting-started/installation",
    description: "Add components with the shadcn CLI",
  },
  {
    href: "/docs/getting-started/agent-skill",
    description: "Teach your agent the whole catalog",
  },
  {
    href: "/docs/getting-started/plugin",
    description: "One command in Claude Code or Codex",
  },
];

export const CRAFT = [
  "/docs/craft/design-defaults",
  "/docs/craft/motion-principles",
  "/docs/craft/anti-patterns",
];

export const GUIDES = {
  index: "/docs/guides",
  setup: "/docs/guides/setup",
  videos: [
    "/docs/guides/launch-video",
    "/docs/guides/feature-announcement",
    "/docs/guides/product-demo",
    "/docs/guides/teaser",
    "/docs/guides/showcase-reel",
    "/docs/guides/changelog-video",
  ],
  practices: [
    "/docs/guides/directing-your-agent",
    "/docs/guides/words-on-screen",
    "/docs/guides/one-video-three-formats",
  ],
};

export const CATEGORIES = [
  { segment: "typography", label: "Typography", href: "/docs/typography" },
  { segment: "ui", label: "UI", href: "/docs/ui" },
  { segment: "transitions", label: "Transitions", href: "/docs/transitions" },
  {
    segment: "captions",
    label: "Captions",
    href: "/docs/captions/getting-started/introduction",
  },
  {
    segment: "shaders",
    label: "Shaders",
    href: "/docs/shaders/getting-started/introduction",
  },
  {
    segment: "motion-graphics",
    label: "Motion graphics",
    href: "/docs/motion-graphics",
  },
  { segment: "logo-stings", label: "Logo stings", href: "/docs/logo-stings" },
  { segment: "camera", label: "Camera & physics", href: "/docs/camera" },
  {
    segment: "graphic-looks",
    label: "Graphic looks",
    href: "/docs/graphic-looks",
  },
  { segment: "ui-blocks", label: "UI blocks", href: "/docs/ui-blocks" },
  { segment: "effects", label: "Effects", href: "/docs/effects" },
  {
    segment: "filters",
    label: "Filters",
    href: "/docs/filters/getting-started/introduction",
  },
  { segment: "social", label: "Social", href: "/docs/social" },
  { segment: "layout", label: "Layout", href: "/docs/layout" },
  {
    segment: "compositions",
    label: "Compositions",
    href: "/docs/compositions",
  },
  { segment: "icons", label: "Icons", href: "/docs/icons/gallery" },
];

export const AGENTS = [
  { href: "/docs/ai/claude-code", mark: "claude" },
  { href: "/docs/ai/claude-chat", mark: "claude" },
  { href: "/docs/ai/chat-gpt", mark: "openai" },
  { href: "/docs/ai/v0", mark: "v0" },
  { href: "/docs/ai/opencode", mark: "opencode" },
  { href: "/docs/ai/agent-run", mark: "agent-run" },
] as const;

export type AgentMark = (typeof AGENTS)[number]["mark"];

export const TEMPLATES = [
  "/docs/templates/release-teaser",
  "/docs/templates/launch-anything",
  "/docs/templates/brand-guidelines",
  "/docs/templates/workflow-console",
  "/docs/templates/fomo-limit-orders",
];
