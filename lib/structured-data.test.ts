import { describe, expect, test } from "bun:test";
import { HOME_KEYWORDS, homeJsonLd, serializeJsonLd } from "./structured-data";

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
