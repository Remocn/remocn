import { GITHUB_URL, SUPPORT_EMAIL, THREADS_URL, X_URL } from "@/config/site";

/**
 * Copy for /about and /contact. Plain strings so the pages and the tests read
 * the same text; a `code` span is wrapped in backticks.
 */

export type TrustSection = { id: string; title: string; body: string[] };

export type TrustLink = { label: string; href: string; external?: boolean };

export type ContactChannel = {
  title: string;
  value: string;
  href: string;
  body: string;
};

export const ABOUT = {
  lead: "Remocn is an open-source registry of video components for Remotion. Describe your product to your AI agent, and it builds the demo video from Remocn's ready-made pieces.",
  sections: [
    {
      id: "what-it-is",
      title: "What Remocn is",
      body: [
        "Remocn is a shadcn registry for Remotion. It ships production-ready text animations, transitions, backgrounds, shaders, filters, captions, app-screen simulations, icons and full scene templates.",
        "You add a component with `npx shadcn@latest add @remocn/<name>`, and its source file is copied into your project. You own the code and can change anything. Every component is written from scratch on the Remotion API (`useCurrentFrame()`, `interpolate()`, `spring()`) and renders the same frame every time.",
      ],
    },
    {
      id: "who-its-for",
      title: "Who it is for",
      body: [
        "Solo builders and small teams who shipped a product and need a demo video for the launch, the changelog or the landing page. Usually that is a frontend developer who already knows shadcn.",
        "No video editor and no motion designer: your coding agent (Claude Code, Codex, GitHub Copilot and others) writes the video in React, and you review it in the live preview.",
      ],
    },
    {
      id: "built-for-agents",
      title: "Built for people and agents",
      body: [
        "Every component page lists its props, its natural length and when to use it, and agents can read any page as Markdown. Agents can also call the remote MCP server at `remocn.dev/mcp`, or work through the Remocn plugin for Claude Code and Codex.",
        "Remocn Studio is a free, open-source macOS app where your agent builds the video from Remocn components while you watch the preview and export the result.",
      ],
    },
    {
      id: "open-source",
      title: "Open source and funding",
      body: [
        "The components are MIT-licensed and free in personal and commercial projects. Remocn is developed in the open on GitHub and maintained by @kapishdima.",
        "The project is funded by its sponsors and by a few paid products, sold through Creem as merchant of record. Bug reports, component ideas and pull requests are welcome.",
      ],
    },
  ] satisfies TrustSection[],
  links: [
    { label: "Read the docs", href: "/docs/getting-started/introduction" },
    { label: "GitHub", href: GITHUB_URL, external: true },
    { label: "Sponsors", href: "/sponsors" },
    { label: "Contact", href: "/contact" },
  ] satisfies TrustLink[],
};

export const CONTACT = {
  lead: "Remocn is a small, independent project, and every channel below is read by the maintainer. Pick the one that fits what you need.",
  channels: [
    {
      title: "Email",
      value: SUPPORT_EMAIL,
      href: `mailto:${SUPPORT_EMAIL}`,
      body: "Questions, partnerships and sponsorship, purchases and refunds, privacy requests, and anything you would rather not post in public.",
    },
    {
      title: "GitHub issues",
      value: "Remocn/remocn",
      href: `${GITHUB_URL}/issues`,
      body: "Bug reports and component requests. Name the component, your Remotion version and the smallest composition that shows the problem, so the fix lands faster.",
    },
    {
      title: "X",
      value: "@_remocn",
      href: X_URL,
      body: "Release news, demos of new components and quick questions.",
    },
    {
      title: "Threads",
      value: "@_remocn",
      href: THREADS_URL,
      body: "The same updates as on X, for people who live on Threads.",
    },
  ] satisfies ContactChannel[],
  sections: [
    {
      id: "security",
      title: "Security issues",
      body: [
        "Found a security problem on remocn.dev, in the MCP server or in a registry file? Email it instead of opening a public issue, so it can be fixed before anyone else reads about it.",
      ],
    },
    {
      id: "purchases",
      title: "Purchases and refunds",
      body: [
        "If a paid product is broken or not as described, email within 14 days of purchase and we will fix it or refund you. The full terms are on the Privacy & Terms page.",
      ],
    },
    {
      id: "sponsorship",
      title: "Sponsorship",
      body: [
        "To back the project or put your logo on the landing page, the Sponsors page lists the tiers. For anything custom, email.",
      ],
    },
  ] satisfies TrustSection[],
};

/** Visible text of a page, for the length check in tests. */
export function trustPageText(page: {
  lead: string;
  sections: TrustSection[];
  channels?: ContactChannel[];
}): string {
  return [
    page.lead,
    ...page.sections.flatMap((s) => [s.title, ...s.body]),
    ...(page.channels ?? []).flatMap((c) => [c.title, c.value, c.body]),
  ].join("\n");
}
