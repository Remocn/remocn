import { describe, expect, it } from "bun:test";
import { getDefaults, resolveControls } from "@/lib/customizer-config";
import {
  echoStackDefaults,
  echoStackLength,
  getEchoStackFade,
  getEchoStackMain,
  getEchoStackRows,
  getEchoStackTime,
} from "..";
import { echoStackConfig } from "../config";

describe("echo-stack main word", () => {
  it("focuses in over 14 frames", () => {
    expect(getEchoStackMain(0)).toEqual({ blur: 12, opacity: 0, scale: 1.04 });
    expect(getEchoStackMain(14)).toEqual({ blur: 0, opacity: 1, scale: 1 });
    expect(getEchoStackMain(7).blur).toBeLessThan(6);
  });
});

describe("echo-stack fade", () => {
  it("hides echoes behind the word and fades them out toward the edges", () => {
    expect(getEchoStackFade(0, 3)).toBe(0);
    expect(getEchoStackFade(0.5, 3)).toBe(0);
    expect(getEchoStackFade(-0.5, 3)).toBe(0);
    expect(getEchoStackFade(1, 3)).toBe(1);
    expect(getEchoStackFade(-1, 3)).toBe(1);
    expect(getEchoStackFade(2, 3)).toBeCloseTo(0.6, 10);
    expect(getEchoStackFade(3.5, 3)).toBe(0);
    expect(getEchoStackFade(5, 3)).toBe(0);
  });

  it("never rises above one", () => {
    for (let d = -6; d <= 6; d += 0.05) {
      const fade = getEchoStackFade(d, 3);
      expect(fade).toBeGreaterThanOrEqual(0);
      expect(fade).toBeLessThanOrEqual(1);
    }
  });
});

describe("echo-stack rows", () => {
  it("stays empty until the unfold begins", () => {
    expect(getEchoStackRows(0)).toEqual([]);
    expect(getEchoStackRows(8)).toEqual([]);
  });

  it("unfolds from a compressed pitch to the full pitch", () => {
    const early = getEchoStackRows(12);
    for (const row of early) {
      expect(Math.abs(row.position)).toBeLessThan(Math.abs(row.offset));
    }
    const late = getEchoStackRows(echoStackLength);
    for (const row of late) expect(row.position).toBeCloseTo(row.offset, 10);
  });

  it("loops seamlessly every cycle", () => {
    const at = (t: number) =>
      getEchoStackRows(t)
        .map((r) => [r.offset.toFixed(6), r.opacity.toFixed(6)].join(":"))
        .sort();
    expect(at(90)).toEqual(at(90 + echoStackDefaults.cycle));
    expect(at(95.5)).toEqual(at(95.5 + echoStackDefaults.cycle));
  });

  it("drifts in the chosen direction", () => {
    const up = getEchoStackRows(70).map((r) => r.offset);
    const upLater = getEchoStackRows(71).map((r) => r.offset);
    expect(upLater[0]).toBeLessThan(up[0]);
    const down = getEchoStackRows(70, { direction: "down" }).map(
      (r) => r.offset,
    );
    const downLater = getEchoStackRows(71, { direction: "down" }).map(
      (r) => r.offset,
    );
    expect(downLater[0]).toBeGreaterThan(down[0]);
  });

  it("caps each echo at echoOpacity", () => {
    for (let t = 0; t < 200; t += 0.5) {
      for (const row of getEchoStackRows(t, { echoOpacity: 0.4 })) {
        expect(row.opacity).toBeGreaterThan(0);
        expect(row.opacity).toBeLessThanOrEqual(0.4);
        expect(Math.abs(row.offset)).toBeGreaterThanOrEqual(0.55);
      }
    }
  });

  it("scales the number of visible echoes with `echoes`", () => {
    const one = getEchoStackRows(60, { echoes: 1 });
    const five = getEchoStackRows(60, { echoes: 5 });
    expect(Math.max(...one.map((r) => Math.abs(r.offset)))).toBeLessThan(1.5);
    expect(Math.max(...five.map((r) => Math.abs(r.offset)))).toBe(5);
  });
});

describe("echo-stack time and config", () => {
  it("maps frames onto the 30 fps timeline", () => {
    expect(getEchoStackTime(30)).toBe(30);
    expect(getEchoStackTime(60, { fps: 60 })).toBe(30);
    expect(getEchoStackTime(10, { speed: 0.5 })).toBe(5);
  });

  it("previews with the component's defaults", () => {
    const defaults = getDefaults(
      resolveControls("echo-stack", echoStackConfig.controls),
    );
    expect(defaults.text).toBe(echoStackDefaults.text);
    expect(defaults.direction).toBe(echoStackDefaults.direction);
    expect(defaults.echoes).toBe(echoStackDefaults.echoes);
    expect(defaults.echoOpacity).toBe(echoStackDefaults.echoOpacity);
    expect(defaults.cycle).toBe(echoStackDefaults.cycle);
    expect(echoStackConfig.durationInFrames % echoStackDefaults.cycle).toBe(0);
  });
});
