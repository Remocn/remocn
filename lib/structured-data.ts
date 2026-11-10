import {
  GITHUB_URL,
  STUDIO_URL,
  SUPPORT_EMAIL,
  THREADS_URL,
  X_URL,
} from "@/config/site";

const SITE_URL = "https://remocn.dev";

const ORG_ID = `${SITE_URL}/#organization`;

/** The maintainer (/about names them), by their public profiles. */
const MAINTAINER_GITHUB = "https://github.com/kapishdima";
const MAINTAINER_X = "https://x.com/kapish_dima";

/** The npm package Remocn publishes (the render SDK). */
const NPM_URL = "https://www.npmjs.com/package/@remocn/render-sdk";

/**
 * Product terms people search together with the brand. Ora and other agents
 * read the first ones as "what Remocn is", so the most specific term leads,
 * and each one also appears in the home page's title, copy or description.
 */
export const HOME_KEYWORDS = [
  "product demo video",
  "Remotion components",
  "shadcn registry",
  "Remotion animations",
  "video transitions",
  "AI agent video",
];

/**
 * JSON-LD for the home page: who publishes the site (Organization), the site
 * itself (WebSite) and the product (SoftwareApplication), linked by `@id`.
 */
export function homeJsonLd(description: string) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": ORG_ID,
        name: "Remocn",
        url: SITE_URL,
        logo: `${SITE_URL}/logo-wordmark.png`,
        email: SUPPORT_EMAIL,
        description:
          "Remocn builds open-source video components for Remotion and the tools to make product demo videos with an AI agent.",
        sameAs: [GITHUB_URL, X_URL, THREADS_URL, NPM_URL],
        founder: {
          "@type": "Person",
          name: "KapishDima",
          url: MAINTAINER_GITHUB,
          sameAs: [MAINTAINER_GITHUB, MAINTAINER_X],
        },
        knowsAbout: ["Remotion", "React", "Motion design", "shadcn/ui"],
        contactPoint: [
          {
            "@type": "ContactPoint",
            contactType: "customer support",
            email: SUPPORT_EMAIL,
            url: `${SITE_URL}/contact`,
            availableLanguage: ["English"],
          },
        ],
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        name: "Remocn",
        url: SITE_URL,
        inLanguage: "en",
        publisher: { "@id": ORG_ID },
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${SITE_URL}/#software`,
        name: "Remocn",
        url: SITE_URL,
        description,
        image: `${SITE_URL}/hero.png`,
        applicationCategory: "DeveloperApplication",
        applicationSubCategory: "Remotion component registry",
        operatingSystem: "Any (Node.js, React, Remotion)",
        keywords: HOME_KEYWORDS.join(", "),
        license: "https://opensource.org/licenses/MIT",
        isAccessibleForFree: true,
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
        softwareHelp: {
          "@type": "CreativeWork",
          url: `${SITE_URL}/docs/getting-started/introduction`,
        },
        installUrl: `${SITE_URL}/docs/getting-started/installation`,
        sameAs: [GITHUB_URL, STUDIO_URL],
        publisher: { "@id": ORG_ID },
        author: { "@id": ORG_ID },
      },
    ],
  };
}

const WEBSITE_ID = `${SITE_URL}/#website`;

/**
 * The Organization by reference, with its name and URL inline: the full node
 * lives on the home page, and Google wants an author name on every article.
 */
const ORG_REF = {
  "@type": "Organization",
  "@id": ORG_ID,
  name: "Remocn",
  url: SITE_URL,
};

function absolute(url: string): string {
  return url.startsWith("/") ? `${SITE_URL}${url}` : url;
}

/** Seconds as an ISO 8601 duration, e.g. 33.4 → "PT33S", 75 → "PT1M15S". */
export function isoDuration(seconds: number): string {
  const total = Math.max(1, Math.round(seconds));
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return `PT${minutes ? `${minutes}M` : ""}${rest ? `${rest}S` : ""}`;
}

export type VideoInput = {
  name: string;
  description: string;
  /** The mp4 itself. */
  contentUrl: string;
  thumbnailUrl: string;
  uploadDate: Date | string;
  /** Seconds; left out when unknown. */
  duration?: number | null;
};

/**
 * A video Google can index and show in video results: name, thumbnail and
 * upload date are required, the mp4 URL lets it read the frames.
 */
export function videoObject(video: VideoInput) {
  const uploadDate =
    typeof video.uploadDate === "string"
      ? video.uploadDate
      : video.uploadDate.toISOString();
  return {
    "@type": "VideoObject",
    name: video.name,
    description: video.description,
    contentUrl: video.contentUrl,
    thumbnailUrl: [video.thumbnailUrl],
    uploadDate,
    ...(video.duration ? { duration: isoDuration(video.duration) } : {}),
    publisher: ORG_REF,
  };
}

export type Crumb = { label: string; href?: string };

/** Breadcrumbs from the site root to the page; the last one is the page. */
function breadcrumbList(url: string, crumbs: Crumb[]) {
  const trail = [{ label: "Remocn", href: "/" }, ...crumbs];
  return {
    "@type": "BreadcrumbList",
    itemListElement: trail.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.label,
      item: absolute(crumb.href ?? url),
    })),
  };
}

export type FaqItem = { question: string; answer: string };

/**
 * The questions of an MDX `<Faq>` block: paragraphs written as
 * `**Question?**` with the answer on the next line (see the Faq component).
 * Links keep their text and inline Markdown is dropped.
 */
export function faqFromMdx(raw: string): FaqItem[] {
  const block = /<Faq>([\s\S]*?)<\/Faq>/.exec(raw)?.[1];
  if (!block) return [];
  return block
    .split(/\n\s*\n/)
    .map((paragraph) => /^\s*\*\*(.+?)\*\*\s*\n([\s\S]+)$/.exec(paragraph))
    .filter((match): match is RegExpExecArray => Boolean(match))
    .map((match) => ({
      question: plain(match[1]),
      answer: plain(match[2]),
    }));
}

function plain(markdown: string): string {
  return markdown
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export type DocsPageInput = {
  /** Path of the page, e.g. "/docs/transitions/zoom-blur". */
  url: string;
  title: string;
  description?: string;
  crumbs: Crumb[];
  image: string;
  /** Registry name, for pages that document an installable component. */
  component?: string;
  faq?: FaqItem[];
};

/**
 * JSON-LD for a docs page: the page as a TechArticle, its breadcrumb trail,
 * the component it documents as source code, and its FAQ when it has one.
 */
export function docsPageJsonLd(page: DocsPageInput) {
  const url = absolute(page.url);
  const article = {
    "@type": "TechArticle",
    "@id": `${url}#article`,
    headline: page.title,
    ...(page.description ? { description: page.description } : {}),
    url,
    mainEntityOfPage: url,
    image: absolute(page.image),
    inLanguage: "en",
    isPartOf: { "@id": WEBSITE_ID },
    publisher: ORG_REF,
    author: ORG_REF,
    ...(page.component
      ? {
          about: {
            "@type": "SoftwareSourceCode",
            name: page.title,
            codeRepository: GITHUB_URL,
            programmingLanguage: "TypeScript",
            runtimePlatform: "Remotion",
            license: "https://opensource.org/licenses/MIT",
            url: `${SITE_URL}/r/${page.component}.json`,
          },
        }
      : {}),
  };
  const graph: unknown[] = [article, breadcrumbList(page.url, page.crumbs)];
  if (page.faq?.length) {
    graph.push({
      "@type": "FAQPage",
      "@id": `${url}#faq`,
      mainEntity: page.faq.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    });
  }
  return { "@context": "https://schema.org", "@graph": graph };
}

export type BlogPostInput = {
  url: string;
  title: string;
  description: string;
  date: Date;
  image: string;
  video?: VideoInput;
};

/** JSON-LD for a blog post, with the video it is about when it has one. */
export function blogPostJsonLd(post: BlogPostInput) {
  const url = absolute(post.url);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting",
        "@id": `${url}#post`,
        headline: post.title,
        description: post.description,
        url,
        mainEntityOfPage: url,
        image: absolute(post.image),
        datePublished: post.date.toISOString(),
        inLanguage: "en",
        isPartOf: { "@id": WEBSITE_ID },
        author: ORG_REF,
        publisher: ORG_REF,
        ...(post.video ? { video: videoObject(post.video) } : {}),
      },
      breadcrumbList(post.url, [
        { label: "Blog", href: "/blog" },
        { label: post.title },
      ]),
    ],
  };
}

/** JSON-LD for a showcase: the video itself, made by its author. */
export function showcaseJsonLd(showcase: {
  url: string;
  video: VideoInput;
  author: { name: string; url: string | null };
}) {
  const url = absolute(showcase.url);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        ...videoObject(showcase.video),
        "@id": `${url}#video`,
        url,
        creator: {
          "@type": "Person",
          name: showcase.author.name,
          ...(showcase.author.url ? { url: showcase.author.url } : {}),
        },
      },
      breadcrumbList(showcase.url, [
        { label: "Showcases", href: "/showcases" },
        { label: showcase.video.name },
      ]),
    ],
  };
}

/** `JSON.stringify` safe to inline in a `<script>` (Next's JSON-LD guide). */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
