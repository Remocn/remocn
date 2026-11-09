import { expect, test } from "bun:test";
import {
  CHANGELOG_VIDEO_MAX_ITEMS,
  calculateChangelogVideoMetadata,
  changelogVideoDefaults,
  changelogVideoDuration,
  resolveChangelogVideoProps,
} from "../content";

test("duration follows the number of items", () => {
  expect(changelogVideoDuration(3)).toBe(630);
  expect(changelogVideoDuration(5)).toBe(900);
  expect(changelogVideoDuration(0)).toBe(changelogVideoDuration(1));
  expect(changelogVideoDuration(99)).toBe(
    changelogVideoDuration(CHANGELOG_VIDEO_MAX_ITEMS),
  );
  expect(
    calculateChangelogVideoMetadata({
      props: { items: [{ title: "A" }, { title: "B" }] },
    }).durationInFrames,
  ).toBe(changelogVideoDuration(2));
});

test("items from a release body are cleaned, never empty", () => {
  const scene = resolveChangelogVideoProps({
    items: [
      { title: "  Dark mode  ", payoff: " Easy on the eyes " },
      { title: "   " },
      { title: "No payoff" },
    ],
  });
  expect(scene.items).toEqual([
    { title: "Dark mode", payoff: "Easy on the eyes" },
    { title: "No payoff", payoff: "" },
  ]);
  expect(resolveChangelogVideoProps({ items: [] }).items).toEqual(
    changelogVideoDefaults.items,
  );
});

test("empty strings hide optional text, blanks keep defaults", () => {
  const scene = resolveChangelogVideoProps({ version: "", url: "" });
  expect(scene.version).toBe("");
  expect(scene.url).toBe("");
  expect(scene.product).toBe(changelogVideoDefaults.product);
  expect(resolveChangelogVideoProps({ theme: "light" }).theme).toBe("light");
});
