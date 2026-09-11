import { describe, expect, it } from "bun:test";
import type { Node, Root } from "fumadocs-core/page-tree";

import { DOCS_TABS, getActiveDocsTab, splitDocsTree } from "./docs-tabs";

const tree: Root = {
  $id: "root",
  name: "Docs",
  children: [
    { type: "page", name: "Typography", url: "/docs/typography" },
    {
      type: "folder",
      name: "UI",
      index: { type: "page", name: "UI", url: "/docs/ui" },
      children: [{ type: "page", name: "Concepts", url: "/docs/ui/concepts" }],
    },
    {
      type: "folder",
      name: "Shaders",
      children: [
        {
          type: "folder",
          name: "Getting Started",
          children: [
            {
              type: "page",
              name: "Introduction",
              url: "/docs/shaders/getting-started/introduction",
            },
          ],
        },
      ],
    },
    {
      type: "folder",
      name: "Filters",
      children: [
        {
          type: "page",
          name: "Introduction",
          url: "/docs/filters/getting-started/introduction",
        },
      ],
    },
    {
      type: "folder",
      name: "Templates",
      children: [
        {
          type: "page",
          name: "Product Showcase",
          url: "/docs/templates/launch-anything",
        },
      ],
    },
    {
      type: "folder",
      name: "Icons",
      children: [{ type: "page", name: "Gallery", url: "/docs/icons/gallery" }],
    },
  ],
};

function collectUrls(nodes: Node[]): string[] {
  const urls: string[] = [];
  for (const node of nodes) {
    if (node.type === "page") urls.push(node.url);
    else if (node.type === "folder") {
      if (node.index) urls.push(node.index.url);
      urls.push(...collectUrls(node.children));
    }
  }
  return urls;
}

describe("splitDocsTree", () => {
  it("routes icons pages only into the icons branch", () => {
    const { icons } = splitDocsTree(tree);
    const urls = collectUrls(icons.children);
    expect(urls).toContain("/docs/icons/gallery");
    expect(urls.every((url) => url.startsWith("/docs/icons"))).toBe(true);
  });

  it("excludes dedicated tab sections from the components branch", () => {
    const { components } = splitDocsTree(tree);
    const urls = collectUrls(components.children);
    expect(urls).toContain("/docs/typography");
    expect(urls.some((url) => url.startsWith("/docs/icons"))).toBe(false);
    expect(urls.some((url) => url.startsWith("/docs/shaders"))).toBe(false);
    expect(urls.some((url) => url.startsWith("/docs/filters"))).toBe(false);
    expect(urls.some((url) => url.startsWith("/docs/templates"))).toBe(false);
    expect(urls.some((url) => url.startsWith("/docs/ui"))).toBe(false);
  });

  it("keeps shaders, templates, and icons in separate branches", () => {
    const { shaders, templates, icons } = splitDocsTree(tree);
    expect(
      collectUrls(shaders.children).some((url) =>
        url.startsWith("/docs/icons"),
      ),
    ).toBe(false);
    expect(
      collectUrls(icons.children).some((url) =>
        url.startsWith("/docs/shaders"),
      ),
    ).toBe(false);
    expect(collectUrls(templates.children)).toEqual([
      "/docs/templates/launch-anything",
    ]);
  });

  it("gives every branch a distinct, stable $id", () => {
    const { components, primitives, shaders, filters, templates, icons } =
      splitDocsTree(tree);
    expect(components.$id).toBe("docs-tab-components");
    expect(primitives.$id).toBe("docs-tab-primitives");
    expect(shaders.$id).toBe("docs-tab-shaders");
    expect(filters.$id).toBe("docs-tab-filters");
    expect(templates.$id).toBe("docs-tab-templates");
    expect(icons.$id).toBe("docs-tab-icons");
    expect(
      new Set([
        components.$id,
        primitives.$id,
        shaders.$id,
        filters.$id,
        templates.$id,
        icons.$id,
      ]).size,
    ).toBe(6);
  });

  it("does not mutate the source tree", () => {
    const before = tree.children.length;
    splitDocsTree(tree);
    expect(tree.children.length).toBe(before);
    expect(tree.$id).toBe("root");
  });
});

describe("getActiveDocsTab", () => {
  it("places Templates immediately after Filters", () => {
    const labels = DOCS_TABS.map((tab) => tab.label);
    expect(labels.indexOf("Templates")).toBe(labels.indexOf("Filters") + 1);
  });

  it("selects the templates tab for template paths", () => {
    expect(getActiveDocsTab("/docs/templates")).toBe("templates");
    expect(getActiveDocsTab("/docs/templates/launch-anything")).toBe(
      "templates",
    );
  });

  it("selects the icons tab for icons paths", () => {
    expect(getActiveDocsTab("/docs/icons")).toBe("icons");
    expect(getActiveDocsTab("/docs/icons/gallery")).toBe("icons");
  });

  it("does not misroute other tabs", () => {
    expect(getActiveDocsTab("/docs/typography")).toBe("components");
    expect(getActiveDocsTab("/docs/ui")).toBe("primitives");
    expect(getActiveDocsTab("/docs/shaders/getting-started/introduction")).toBe(
      "shaders",
    );
  });
});
