import { describe, expect, it } from "bun:test";
import type { ControlConfig } from "./customizer-config";
import {
  buildReport,
  type CustomizeEvent,
  renderReport,
} from "./customizer-report";

const configs: Record<string, ControlConfig> = {
  "fade-in": {
    text: { type: "text", default: "Hello", label: "Text" },
    speed: {
      type: "number",
      default: 1,
      min: 0,
      max: 2,
      step: 0.25,
      label: "Speed",
    },
    theme: {
      type: "select",
      default: "dark",
      options: ["dark", "light"],
      label: "Theme",
    },
    loop: { type: "boolean", default: false, label: "Loop" },
  },
};

let n = 0;
function event(
  deviceId: string,
  prop: string,
  query: Record<string, string> = {},
  extra: Partial<CustomizeEvent> = {},
): CustomizeEvent {
  n += 1;
  return {
    id: String(n),
    createdAt: `2026-11-01T00:00:${String(n).padStart(2, "0")}.000Z`,
    deviceId,
    component: "fade-in",
    prop,
    query,
    ...extra,
  };
}

describe("buildReport", () => {
  it("counts a person once per prop, at the value they left it", () => {
    const report = buildReport(
      [
        event("a", "speed", { fade_in_speed: "1.5" }),
        event("a", "speed", { fade_in_speed: "2" }),
        event("b", "speed", { fade_in_speed: "2" }),
        event("c", "speed"),
      ],
      configs,
      { minPeople: 1 },
    );
    const speed = report.components[0].props[0];
    expect(speed.people).toBe(3);
    expect(speed.changes).toBe(4);
    expect(speed.values).toEqual([
      { value: "2", people: 2, share: 2 / 3 },
      { value: "1", people: 1, share: 1 / 3 },
    ]);
  });

  it("flags a default most people move away from", () => {
    const report = buildReport(
      [
        event("a", "theme", { fade_in_theme: "light" }),
        event("b", "theme", { fade_in_theme: "light" }),
        event("c", "theme"),
      ],
      configs,
      { minPeople: 3 },
    );
    expect(report.reconsider).toEqual([
      {
        component: "fade-in",
        prop: "theme",
        label: "Theme",
        defaultValue: "dark",
        picked: "light",
        share: 2 / 3,
        people: 3,
      },
    ]);
  });

  it("never reports typed text", () => {
    const report = buildReport(
      [event("a", "text", { fade_in_text: "my secret launch" })],
      configs,
    );
    expect(report.components[0].props[0].values).toEqual([]);
    expect(renderReport(report)).not.toContain("secret");
  });

  it("lists untouched props and sources, and skips unknown props", () => {
    const report = buildReport(
      [
        event("a", "loop", { fade_in_loop: "true" }, { source: "mouse" }),
        event("a", "gone"),
        event("b", "loop", { fade_in_loop: "true" }),
      ],
      configs,
    );
    expect(report.changes).toBe(2);
    expect(report.components[0].untouched).toEqual(["text", "speed", "theme"]);
    expect(report.bySource).toEqual([
      { source: "mouse", changes: 1 },
      { source: "unknown", changes: 1 },
    ]);
  });
});
