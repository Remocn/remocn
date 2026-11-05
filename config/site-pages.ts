/**
 * Standalone site pages that share one card from `/og/pages/<key>`. The page
 * reads its description from here too, so the card and the meta tags can't
 * drift apart.
 */
export const SITE_PAGES = {
  changelog: {
    title: "Changelog",
    description:
      "Every release of Remocn — new components, transitions, shaders, icons, and improvements, newest first.",
  },
  blog: {
    title: "Blog",
    description:
      "Making-of stories behind the videos we build with Remocn — the storyboard, the decisions that made each one work, and the prompt that rebuilds it.",
  },
  sponsors: {
    title: "Sponsors",
    description:
      "Support Remocn and keep the components free and open source. Back the project monthly, from a name in the README to your logo on the landing page.",
  },
  legal: {
    title: "Privacy & Terms",
    description:
      "How Remocn handles your data, and the terms that apply to the site, the free components, and paid products.",
  },
  stars: {
    title: "GitHub Stars Video Generator",
    description:
      "Turn your repo's stars into a shareable animated video. Paste a GitHub repo and we animate every stargazer into a clip you can own.",
  },
  "inspired-by": {
    title: "Inspired by",
    description:
      "The people on X whose work shaped Remocn: motion, design and code we learned from.",
  },
} as const;

export type SitePageKey = keyof typeof SITE_PAGES;

export const sitePageOgImage = (key: SitePageKey) => ({
  url: `/og/pages/${key}`,
  width: 1200,
  height: 630,
  alt: `${SITE_PAGES[key].title} · Remocn`,
});
