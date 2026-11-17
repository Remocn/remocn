import { describe, expect, test } from "bun:test";
import {
  getDefaults,
  resolveControls,
  sceneControls,
} from "@/lib/customizer-config";
import { parseLiterals } from "./literals";

const controls = resolveControls("test-scene", {
  theme: {
    type: "enum",
    default: "dark",
    variants: { dark: {}, light: {} },
    description: "Theme",
  },
  label: { type: "text-content", default: "renders", description: "Label" },
  accent: { type: "color", default: "#3B5BFD", description: "Accent" },
  ...sceneControls({ font: "Geist", grain: true }),
});
const values = getDefaults(controls);
const parse = (text: string, current = values) =>
  parseLiterals(text, controls, current);

describe("parseLiterals", () => {
  test("relative speed, scaled by intensity", () => {
    expect(parse("slower").patch).toEqual({ speed: 0.75 });
    expect(parse("much slower").patch).toEqual({ speed: 0.5 });
    expect(parse("сделай быстрее").patch).toEqual({ speed: 1.5 });
    expect(parse("faster", { ...values, speed: 2 }).patch).toEqual({
      speed: 3,
    });
  });

  test("numbers with units", () => {
    expect(parse("2x faster").patch).toEqual({ speed: 2 });
    expect(parse("в 2 раза медленнее").patch).toEqual({ speed: 0.5 });
    expect(parse("delay 1s").patch).toEqual({ delay: 30 });
    expect(parse("задержка 12 кадров").patch).toEqual({ delay: 12 });
    expect(parse("scale 120%").patch).toEqual({ scale: 1.2 });
  });

  test("colours go to the prop their noun names", () => {
    expect(parse("white text on a black background").patch).toEqual({
      ink: "#fafafa",
      background: "#0a0a0a",
    });
    expect(parse("синий фон").patch).toEqual({ background: "#3b82f6" });
    expect(parse("red").patch).toEqual({ accent: "#ef4444" });
    expect(parse("accent #ff0066").patch).toEqual({ accent: "#ff0066" });
  });

  test("selects by option, switches by label", () => {
    expect(parse("light").patch).toEqual({ theme: "light" });
    expect(parse("no grain").patch).toEqual({ grain: false });
    expect(parse("без зерна").patch).toEqual({ grain: false });
  });

  test("fonts by name and by kind", () => {
    expect(parse("Fraunces").patch).toEqual({ fontFamily: "Fraunces" });
    expect(parse("serif font").patch).toEqual({
      fontFamily: "Instrument Serif",
    });
    expect(parse("моноширинный шрифт").patch).toEqual({
      fontFamily: "JetBrains Mono",
    });
  });

  test("quoted copy fills a text prop", () => {
    expect(parse('label "Launch day"').patch).toEqual({ label: "Launch day" });
  });

  test("a combined request is read in full", () => {
    const result = parse("чуть медленнее, тёмный фон и шрифт с засечками");
    expect(result.patch).toEqual({
      speed: 0.75,
      background: "#0a0a0a",
      fontFamily: "Instrument Serif",
    });
    expect(result.leftover).toEqual([]);
  });

  test("words it can't read come back as leftover", () => {
    const result = parse("slower and make the bars wobble");
    expect(result.patch).toEqual({ speed: 0.75 });
    expect(result.leftover).toEqual(["bars", "wobble"]);
    expect(parse("write me a python program").leftover).toContain("python");
  });
});

test("a colour aimed at a prop wins over a select option of the same name", () => {
  const result = parseLiterals(
    "slower, dark background, serif",
    controls,
    values,
  );
  expect(result.patch).toEqual({
    speed: 0.75,
    background: "#0a0a0a",
    fontFamily: "Instrument Serif",
  });
  expect(result.leftover).toEqual([]);
});
