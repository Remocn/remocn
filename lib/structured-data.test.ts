import { describe, expect, test } from "bun:test";
import {
  blogPostJsonLd,
  docsPageJsonLd,
  faqFromMdx,
  HOME_KEYWORDS,
  homeJsonLd,
  isoDuration,
  serializeJsonLd,
  showcaseJsonLd,
} from "./structured-data";

type Node = Record<string, unknown>;

const graph = homeJsonLd("Describe your product, get a demo video.")[
  "@graph"
] as Node[];
const byType = (type: string) => graph.find((n) => n["@type"] === type);

describe("home JSON-LD", () => {
  test("uses the schema.org context", () => {
    expect(homeJsonLd("x")["@context"]).toBe("https://schema.org");
  });

  test("describes the product as a free SoftwareApplication", () => {
    const app = byType("SoftwareApplication");
    expect(app).toMatchObject({
      name: "Remocn",
      url: "https://remocn.dev",
      description: "Describe your product, get a demo video.",
      applicationCategory: "DeveloperApplication",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    });
    expect(app?.keywords).toBe(HOME_KEYWORDS.join(", "));
  });

  test("names the Organization with a contact point and profiles", () => {
    const org = byType("Organization");
    expect(org).toMatchObject({ name: "Remocn", url: "https://remocn.dev" });
    expect(org?.contactPoint).toContainEqual(
      expect.objectContaining({
        "@type": "ContactPoint",
        contactType: "customer support",
        email: "kapish@remocn.dev",
      }),
    );
    expect(org?.sameAs).toContain("https://github.com/Remocn/remocn");
  });

  test("every @id reference points at a node in the graph", () => {
    const ids = new Set(graph.map((n) => n["@id"]));
    const refs = JSON.stringify(graph).match(/\{"@id":"[^"]+"\}/g) ?? [];
    expect(refs.length).toBeGreaterThan(0);
    for (const ref of refs) expect(ids.has(JSON.parse(ref)["@id"])).toBe(true);
  });

  test("leads with a product term from the page title", () => {
    expect("Remocn - Make a product demo video with your AI agent").toContain(
      HOME_KEYWORDS[0],
    );
  });
});

describe("serializeJsonLd", () => {
  test("cannot close the script tag", () => {
    const out = serializeJsonLd({ x: "</script><script>alert(1)</script>" });
    expect(out).not.toContain("<");
    expect(JSON.parse(out).x).toBe("</script><script>alert(1)</script>");
  });
});

describe("docs page JSON-LD", () => {
  const doc = docsPageJsonLd({
    url: "/docs/transitions/zoom-blur",
    title: "Zoom Blur",
    description: "Depth punch-in",
    crumbs: [
      { label: "Transitions", href: "/docs/transitions" },
      { label: "Zoom Blur" },
    ],
    image: "/og/docs/transitions/zoom-blur",
    component: "zoom-blur",
  });
  const nodes = doc["@graph"] as Node[];
  const find = (type: string) => nodes.find((n) => n["@type"] === type);

  test("is a TechArticle about the component's source", () => {
    expect(find("TechArticle")).toMatchObject({
      headline: "Zoom Blur",
      url: "https://remocn.dev/docs/transitions/zoom-blur",
      image: "https://remocn.dev/og/docs/transitions/zoom-blur",
      about: {
        "@type": "SoftwareSourceCode",
        url: "https://remocn.dev/r/zoom-blur.json",
      },
    });
  });

  test("breadcrumbs run from the home page to the page itself", () => {
    const items = find("BreadcrumbList")?.itemListElement as Node[];
    expect(items.map((item) => item.item)).toEqual([
      "https://remocn.dev/",
      "https://remocn.dev/docs/transitions",
      "https://remocn.dev/docs/transitions/zoom-blur",
    ]);
    expect(items.map((item) => item.position)).toEqual([1, 2, 3]);
  });

  test("adds an FAQPage only when the page has questions", () => {
    expect(find("FAQPage")).toBeUndefined();
    const withFaq = docsPageJsonLd({
      url: "/docs/x",
      title: "X",
      crumbs: [],
      image: "/hero.png",
      faq: [{ question: "Is it free?", answer: "Yes." }],
    })["@graph"] as Node[];
    expect(withFaq.find((n) => n["@type"] === "FAQPage")).toMatchObject({
      mainEntity: [
        {
          "@type": "Question",
          name: "Is it free?",
          acceptedAnswer: { "@type": "Answer", text: "Yes." },
        },
      ],
    });
  });
});

describe("faqFromMdx", () => {
  test("reads bold questions and plain answers out of <Faq>", () => {
    const raw = [
      "Intro.",
      "",
      "<Faq>",
      "",
      "**Do I need **code**?**",
      "Not with an [agent](/docs/guides). Use `npx`.",
      "",
      "**Is it free?**",
      "MIT.",
      "",
      "</Faq>",
    ].join("\n");
    expect(faqFromMdx(raw)).toEqual([
      { question: "Do I need code?", answer: "Not with an agent. Use npx." },
      { question: "Is it free?", answer: "MIT." },
    ]);
  });

  test("returns nothing for a page without a FAQ", () => {
    expect(faqFromMdx("**Bold**\nText")).toEqual([]);
  });
});

describe("video JSON-LD", () => {
  test("ISO 8601 durations", () => {
    expect(isoDuration(33.4)).toBe("PT33S");
    expect(isoDuration(75)).toBe("PT1M15S");
    expect(isoDuration(120)).toBe("PT2M");
  });

  test("a blog post carries its video", () => {
    const post = blogPostJsonLd({
      url: "/blog/nextjs-launch-video",
      title: "Next.js",
      description: "The eclipse cut",
      date: new Date("2026-07-22T00:00:00Z"),
      image: "https://cdn.remocn.dev/posters/n.png",
      video: {
        name: "Next.js",
        description: "The eclipse cut",
        contentUrl: "https://cdn.remocn.dev/videos/n.mp4",
        thumbnailUrl: "https://cdn.remocn.dev/posters/n.png",
        uploadDate: new Date("2026-07-22T00:00:00Z"),
        duration: 33,
      },
    })["@graph"] as Node[];
    expect(post[0]).toMatchObject({
      "@type": "BlogPosting",
      datePublished: "2026-07-22T00:00:00.000Z",
      video: {
        "@type": "VideoObject",
        contentUrl: "https://cdn.remocn.dev/videos/n.mp4",
        thumbnailUrl: ["https://cdn.remocn.dev/posters/n.png"],
        uploadDate: "2026-07-22T00:00:00.000Z",
        duration: "PT33S",
      },
    });
  });

  test("a video without a known length leaves duration out", () => {
    const video = showcaseJsonLd({
      url: "/showcases/x",
      author: { name: "Ann", url: null },
      video: {
        name: "X",
        description: "d",
        contentUrl: "https://cdn.remocn.dev/x.mp4",
        thumbnailUrl: "https://cdn.remocn.dev/x.png",
        uploadDate: "2026-09-01",
        duration: null,
      },
    })["@graph"] as Node[];
    expect(video[0]).not.toHaveProperty("duration");
    expect(video[0]).toMatchObject({
      "@type": "VideoObject",
      creator: { "@type": "Person", name: "Ann" },
    });
  });
});
