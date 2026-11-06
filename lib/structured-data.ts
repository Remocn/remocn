import {
  GITHUB_URL,
  STUDIO_URL,
  SUPPORT_EMAIL,
  THREADS_URL,
  X_URL,
} from "@/config/site";

const SITE_URL = "https://remocn.dev";

const ORG_ID = `${SITE_URL}/#organization`;

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
        sameAs: [GITHUB_URL, X_URL, THREADS_URL],
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

/** `JSON.stringify` safe to inline in a `<script>` (Next's JSON-LD guide). */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
