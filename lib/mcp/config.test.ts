import { describe, expect, it } from "bun:test";
import { customizedDocsUrl } from "./config";

describe("customizedDocsUrl", () => {
  const page = "https://remocn.dev/docs/text/fade-in";

  it("sets each scalar prop under the customizer's query key", () => {
    const url = new URL(
      customizedDocsUrl(page, "fade-in", {
        text: "Launch day",
        speed: 0.5,
        loop: true,
        accent: "#ff6600",
      }),
    );
    expect(url.searchParams.get("fade_in_text")).toBe("Launch day");
    expect(url.searchParams.get("fade_in_speed")).toBe("0.5");
    expect(url.searchParams.get("fade_in_loop")).toBe("true");
    expect(url.searchParams.get("fade_in_accent")).toBe("#ff6600");
  });

  it("drops props no control can hold", () => {
    const url = new URL(
      customizedDocsUrl(page, "fade-in", {
        words: ["a", "b"],
        style: { color: "red" },
        size: Number.NaN,
      }),
    );
    expect([...url.searchParams.keys()]).toEqual([]);
  });

  it("leaves the page as is without props", () => {
    expect(customizedDocsUrl(page, "fade-in")).toBe(page);
  });
});
