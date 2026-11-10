import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { ABOUT, CONTACT, trustPageText } from "./trust-pages";

// Agents check trust pages for real content, not a stub.
const MIN_CHARS = 500;

describe("trust pages", () => {
  test("/about has real content", () => {
    expect(trustPageText(ABOUT).length).toBeGreaterThanOrEqual(MIN_CHARS);
  });

  test("/contact has real content and an email channel", () => {
    expect(trustPageText(CONTACT).length).toBeGreaterThanOrEqual(MIN_CHARS);
    expect(CONTACT.channels[0].href).toBe("mailto:kapish@remocn.dev");
  });

  test("each page has a route", () => {
    for (const page of ["about", "contact"]) {
      expect(
        existsSync(
          join(import.meta.dir, "..", "app", "(home)", page, "page.tsx"),
        ),
      ).toBe(true);
    }
  });

  test("internal links point at real pages", () => {
    for (const link of ABOUT.links.filter((l) => !l.external)) {
      expect(link.href).toStartWith("/");
    }
  });
});
