import { describe, expect, it } from "bun:test";
import type { SortedResult } from "fumadocs-core/search";
import { type ComponentHit, mergeDocsResults } from "./docs-merge";

const clock: ComponentHit = {
  name: "clock-sweep",
  title: "Clock Sweep",
  description: "A clock hand sweeps a glowing wedge",
  url: "/docs/numbers/clock-sweep",
  section: "numbers",
};

const COMPONENT_URLS = new Set(["/docs/numbers/clock-sweep", "/docs/ui/tabs"]);

function page(url: string, content: string): SortedResult {
  return { id: url, url, type: "page", content };
}

function text(url: string, content: string): SortedResult {
  return { id: `${url}-text`, url, type: "text", content };
}

describe("mergeDocsResults", () => {
  it("keeps a guide whose title matched above the components", () => {
    const docs = [
      page("/docs/getting-started/installation", "<mark>Installation</mark>"),
      text("/docs/getting-started/installation#cli", "Run the CLI"),
    ];

    const merged = mergeDocsResults(
      "installation",
      docs,
      [clock],
      COMPONENT_URLS,
    );

    expect(merged.map((r) => r.url)).toEqual([
      "/docs/getting-started/installation",
      "/docs/getting-started/installation#cli",
      "/docs/numbers/clock-sweep",
      "/docs/numbers/clock-sweep",
    ]);
  });

  it("puts components above text matches that only mention the words", () => {
    const docs = [
      page("/docs/guides/timing", "Timing"),
      text("/docs/guides/timing#minutes", "takes five <mark>minutes</mark>"),
    ];

    const merged = mergeDocsResults(
      "setup takes five minutes",
      docs,
      [clock],
      COMPONENT_URLS,
    );

    expect(merged[0]).toMatchObject({
      id: "component:clock-sweep",
      type: "page",
      content: "Clock Sweep",
      breadcrumbs: ["Numbers"],
    });
    expect(merged[1].content).toBe(clock.description);
    expect(merged.at(-1)?.url).toBe("/docs/guides/timing#minutes");
  });

  it("shows a component once when the full-text search found its page too", () => {
    const docs = [
      {
        ...page(clock.url, "<mark>Clock</mark> Sweep"),
        breadcrumbs: ["Stats"],
      },
      text(`${clock.url}#usage`, "Usage"),
    ];

    const merged = mergeDocsResults("clock", docs, [clock], COMPONENT_URLS);

    expect(merged.map((r) => r.id)).toEqual([
      "component:clock-sweep",
      "component:clock-sweep:description",
    ]);
    expect(merged[0].breadcrumbs).toEqual(["Stats"]);
  });

  it("does not promote a component page as if it were a guide", () => {
    const docs = [page("/docs/ui/tabs", "<mark>Tabs</mark>")];

    const merged = mergeDocsResults("tabs", docs, [clock], COMPONENT_URLS);

    expect(merged[0].id).toBe("component:clock-sweep");
    expect(merged.at(-1)?.url).toBe("/docs/ui/tabs");
  });

  it("does not promote a guide that shares one word with a described need", () => {
    const docs = [page("/docs/guides/setup", "<mark>Setup</mark>")];

    const merged = mergeDocsResults(
      "show that setup only takes five minutes",
      docs,
      [clock],
      COMPONENT_URLS,
    );

    expect(merged[0].id).toBe("component:clock-sweep");
    expect(merged.at(-1)?.url).toBe("/docs/guides/setup");
  });
});
