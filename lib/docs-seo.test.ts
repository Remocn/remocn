import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { Glob } from "bun";
import {
  DOCS_SEO_SECTIONS,
  docsSeoDescription,
  docsSeoTitle,
} from "./docs-seo";

describe("docsSeoTitle", () => {
  it("names the kind of component and Remotion", () => {
    expect(
      docsSeoTitle({
        slug: ["transitions", "whip-pan"],
        title: "Whip Pan",
        component: "whip-pan",
      }),
    ).toBe("Whip Pan: Remotion transition");
    expect(
      docsSeoTitle({
        slug: ["typography", "shimmer-sweep"],
        title: "Shimmer Sweep",
        component: "shimmer-sweep",
      }),
    ).toBe("Shimmer Sweep: Remotion text animation");
  });

  it("names the parent shader on a preset page", () => {
    expect(
      docsSeoTitle({
        slug: ["shaders", "components", "shader-swirl", "hypno"],
        title: "Hypno",
        component: "shader-swirl-hypno",
        parentTitle: "Swirl",
      }),
    ).toBe("Hypno: Swirl shader preset for Remotion");
    expect(
      docsSeoTitle({
        slug: ["shaders", "components", "shader-swirl"],
        title: "Swirl",
        component: "shader-swirl",
        parentTitle: "Shaders",
      }),
    ).toBe("Swirl: Remotion shader background");
  });

  it("tells the library introductions apart", () => {
    const titles = ["shaders", "filters", "captions"].map((tier) =>
      docsSeoTitle({
        slug: [tier, "getting-started", "introduction"],
        title: "Introduction",
      }),
    );
    expect(new Set(titles).size).toBe(titles.length);
    expect(docsSeoTitle({ slug: ["ui"], title: "Introduction" })).toBe(
      "Introduction: UI primitives for Remotion",
    );
    expect(docsSeoTitle({ slug: ["icons", "gallery"], title: "Gallery" })).toBe(
      "Gallery: Animated icons for Remotion",
    );
  });

  it("anchors a category index to Remotion", () => {
    expect(docsSeoTitle({ slug: ["ui-blocks"], title: "UI Blocks" })).toBe(
      "UI Blocks for Remotion",
    );
  });

  it("leaves a title that already names Remotion alone", () => {
    const title = "Typography: 256 animated text effects for Remotion";
    expect(docsSeoTitle({ slug: ["typography"], title })).toBe(title);
  });

  it("leaves getting-started pages alone", () => {
    expect(
      docsSeoTitle({
        slug: ["getting-started", "installation"],
        title: "Installation",
      }),
    ).toBe("Installation");
  });

  it("anchors guides and craft pages to Remotion", () => {
    expect(docsSeoTitle({ slug: ["guides", "teaser"], title: "Teaser" })).toBe(
      "Teaser: a Remotion video guide",
    );
    expect(docsSeoTitle({ slug: ["guides"], title: "Guides" })).toBe(
      "Remotion video guides",
    );
    expect(
      docsSeoTitle({
        slug: ["craft", "anti-patterns"],
        title: "Anti-patterns",
      }),
    ).toBe("Anti-patterns: motion design for Remotion videos");
    const title = "SaaS launch video template for Remotion";
    expect(docsSeoTitle({ slug: ["guides", "launch-video"], title })).toBe(
      title,
    );
  });

  it("keeps a guide title that is already a full question", () => {
    const title = "How to turn app screenshots into a video";
    expect(
      docsSeoTitle({ slug: ["guides", "screenshots-to-video"], title }),
    ).toBe(title);
  });
});

describe("docsSeoDescription", () => {
  it("adds what the component is and how it installs", () => {
    expect(
      docsSeoDescription({
        slug: ["shaders", "components", "shader-god-rays"],
        title: "God Rays",
        description:
          "Volumetric light rays radiating from an off-screen source.",
        component: "shader-god-rays",
      }),
    ).toBe(
      "Volumetric light rays radiating from an off-screen source. A free, MIT-licensed Remotion shader background.",
    );
  });

  it("keeps the description of a page that is not a component", () => {
    const description = "Counters, stat reveals, charts, prices and countdowns";
    expect(
      docsSeoDescription({
        slug: ["numbers"],
        title: "Numbers & Stats",
        description,
      }),
    ).toBe(description);
  });

  it("keeps a description that already names Remotion", () => {
    const description = "Animated captions for Remotion, word by word";
    expect(
      docsSeoDescription({
        slug: ["captions", "components", "caption-cube"],
        title: "Caption Cube",
        description,
        component: "caption-cube",
      }),
    ).toBe(description);
  });
});

describe("every docs section with components has a kind", () => {
  it("covers each top-level folder that holds a component page", () => {
    const sections = new Set<string>();
    for (const file of new Glob("content/docs/**/*.mdx").scanSync(".")) {
      const src = readFileSync(file, "utf8");
      const end = src.indexOf("\n---", 3);
      if (!/^component:/m.test(src.slice(0, end))) continue;
      sections.add(file.split("/")[2]);
    }
    const missing = [...sections].filter(
      (section) => !DOCS_SEO_SECTIONS[section]?.kind,
    );
    expect(missing).toEqual([]);
  });
});
