import { expect, test } from "bun:test";
import { getTypedSplitWipeText } from "..";

test("type-on never exposes half of a supplementary Unicode character", () => {
  const text = "Introducing 𝕏 Ads 🚀";
  const characters = Array.from(text);
  for (let frame = 0; frame <= 60; frame++) {
    const visible = getTypedSplitWipeText(text, frame, 60);
    expect(visible).toBe(
      characters.slice(0, Array.from(visible).length).join(""),
    );
  }
  expect(getTypedSplitWipeText(text, 60, 60)).toBe(text);
});

test("ASCII pacing, empty content, and out-of-order seeks remain stable", () => {
  expect(getTypedSplitWipeText("hello", 0, 30)).toBe("h");
  expect(getTypedSplitWipeText("hello", 15, 30)).toBe("hel");
  expect(getTypedSplitWipeText("", 15, 30)).toBe("");
  expect(getTypedSplitWipeText("hello", 0, 0)).toBe("h");
  const first = getTypedSplitWipeText("𝕏 Ads MCP", 20, 60);
  getTypedSplitWipeText("𝕏 Ads MCP", 59, 60);
  expect(getTypedSplitWipeText("𝕏 Ads MCP", 20, 60)).toBe(first);
});
