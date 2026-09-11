import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fomoContent, fomoTheme } from "../fomo-limit-orders/content";
import { launchMedia } from "../launch-anything/assets";
import { launchContent, resolveLaunchProps } from "../launch-anything/content";
import {
  resolveXAdsProps,
  terminalContent,
  workflowEnvironments,
  workflowTools,
  xAdsContent,
} from "../x-ads-mcp/content";

const root = path.resolve(import.meta.dir, "../../..");

test("each default identity has independent copy and its own palette", () => {
  expect(fomoContent.assetName).toBe("Demo Market");
  expect(fomoContent.ticker).toBe("DEMO");
  expect(fomoTheme.accent).toBe("#e8b45a");
  expect(resolveXAdsProps({}).accent).toBe("#8ed8f8");
  expect(resolveXAdsProps({}).background).toBe("#0e1b2b");
  expect(xAdsContent.product).toBe("Workflow Console");
  expect(resolveLaunchProps({}).accent).toBe("#245744");
  expect(resolveLaunchProps({}).brandUrl).toBe("yourproduct.example");
  expect(launchContent.integrations).toEqual(["Files", "Messages", "Calendar"]);
  const defaults = JSON.stringify([
    fomoContent,
    launchContent,
    xAdsContent,
    workflowTools,
    ...["campaign", "launched", "stats"].map((run) =>
      terminalContent(run as "campaign" | "launched" | "stats", xAdsContent),
    ),
  ]);
  expect(defaults).not.toMatch(
    /SpaceX|Fomo|Grok|X-ads|Ads MCP|Launchanything\.now|Slack|Amplitude|Hubspot/i,
  );
});

test("environment defaults and legacy country overrides both work", () => {
  const scene = resolveXAdsProps({ environments: [], tools: [] });
  expect(scene.useCountries).toBe(false);
  expect(scene.environments).toEqual(workflowEnvironments);
  expect(scene.tools).toEqual(workflowTools);
  expect(resolveXAdsProps({ countries: ["Japan"] }).useCountries).toBe(true);
  const custom = resolveXAdsProps({
    countries: ["Japan"],
    environments: [{ label: "Review", topology: "parallel" }],
    tools: ["Read checklist"],
  });
  expect(custom.useCountries).toBe(false);
  expect(custom.environments).toEqual([
    { label: "Review", topology: "parallel" },
  ]);
  expect(custom.tools).toEqual(["Read checklist"]);
});

test("all four bundled plates match the new original assets", () => {
  for (const [key, file] of [
    ["desk", "workbench"],
    ["horizon", "gallery"],
    ["rocket", "sculpture"],
    ["earth", "courtyard"],
  ] as const) {
    const actual = readFileSync(
      path.join(root, "public/templates/product-showcase", `${file}.jpg`),
    ).toString("base64");
    expect(launchMedia[key]).toBe(`data:image/jpeg;base64,${actual}`);
  }
});

test("catalog titles and preferred exports change without breaking registry IDs", () => {
  const registry = JSON.parse(
    readFileSync(
      path.join(root, "registry/remocn-templates/registry.json"),
      "utf8",
    ),
  );
  for (const [id, title, preferred, legacy] of [
    ["fomo-limit-orders", "Order Flow", "OrderFlow", "FomoLimitOrders"],
    ["x-ads-mcp", "Workflow Console", "WorkflowConsole", "XAdsMcp"],
    [
      "launch-anything",
      "Product Showcase",
      "ProductShowcase",
      "LaunchAnything",
    ],
  ]) {
    expect(
      registry.items.find((item: { name: string }) => item.name === id).title,
    ).toBe(title);
    const source = readFileSync(
      path.join(root, "registry/remocn-templates", id, "index.tsx"),
      "utf8",
    );
    expect(source).toContain(`export const ${preferred} = ${legacy}`);
    expect(source).toContain(`componentName: "${preferred}"`);
    expect(source).toContain(`export function ${legacy}`);
  }
});
