import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createAgent } from "@ui-sdk/react/agent";
import { useState } from "react";
import { beforeAll, describe, expect, test } from "vitest";
import type { ControlConfig } from "@/lib/customizer-config";
import { ComponentCustomizer } from "./component-customizer";

const controls: ControlConfig = {
  title: { type: "text", default: "Ship it", label: "Title" },
  speed: {
    type: "number",
    default: 1,
    min: 0,
    max: 2,
    step: 0.1,
    label: "Speed",
  },
  frames: {
    type: "number-input",
    default: 90,
    min: 0,
    max: Number.MAX_SAFE_INTEGER,
    step: 1,
    label: "Frames",
  },
  accent: { type: "color", default: "#ff00aa", label: "Accent" },
  theme: {
    type: "select",
    default: "dark",
    options: ["dark", "light"],
    label: "Theme",
  },
  loop: { type: "boolean", default: false, label: "Loop" },
};

const defaults = () =>
  Object.fromEntries(
    Object.entries(controls).map(([key, ctrl]) => [key, ctrl.default]),
  );

let latest: Record<string, unknown> = {};
function Harness() {
  const [values, setValues] = useState<Record<string, unknown>>(defaults);
  latest = values;
  return (
    <ComponentCustomizer
      controls={controls}
      values={values}
      onChange={(key, value) =>
        setValues((prev) => ({ ...prev, [key]: value }))
      }
    />
  );
}

beforeAll(() => {
  window.matchMedia ??= ((query: string) => ({
    matches: false,
    media: query,
    addEventListener() {},
    removeEventListener() {},
  })) as unknown as typeof window.matchMedia;
});

describe("customizer controls", () => {
  test("text field is named by its label and reports what is typed", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const input = screen.getByLabelText("Title");
    await user.clear(input);
    await user.type(input, "Launch");
    expect(latest.title).toBe("Launch");
  });

  test("slider steps by step, Shift by ten steps, and reads formatted", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const slider = screen.getByRole("slider", { name: "Speed" });
    expect(slider.getAttribute("aria-valuetext")).toBe("1.0");
    act(() => slider.focus());
    await user.keyboard("{ArrowRight}");
    expect(latest.speed).toBe(1.1);
    await user.keyboard("{Shift>}{ArrowLeft}{/Shift}");
    expect(latest.speed).toBe(0.1);
    await user.keyboard("{End}");
    expect(latest.speed).toBe(2);
  });

  test("number field commits a typed value", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const input = screen.getByLabelText("Frames");
    await user.clear(input);
    await user.type(input, "120{Enter}");
    expect(latest.frames).toBe(120);
  });

  test("switch toggles with a click on the tile and with Space", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const toggle = screen.getByRole("switch", { name: "Loop" });
    await user.click(screen.getByText("Loop"));
    expect(latest.loop).toBe(true);
    act(() => toggle.focus());
    await user.keyboard(" ");
    expect(latest.loop).toBe(false);
  });

  test("select opens and picks an option", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole("combobox", { name: "Theme" }));
    await user.click(screen.getByRole("option", { name: "light" }));
    expect(latest.theme).toBe("light");
  });

  test("color opens a picker whose hex field sets the value", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const trigger = screen.getByRole("button", { name: "Accent" });
    expect(within(trigger).getByText("#FF00AA")).toBeTruthy();
    await user.click(trigger);
    const hex = screen.getByRole("textbox", { name: "Accent hex" });
    await user.clear(hex);
    await user.type(hex, "#00ff00{Enter}");
    expect(latest.accent).toBe("#00ff00");
  });
});

describe("agent", () => {
  const agent = createAgent();

  test("an agent can find and change every control", async () => {
    render(<Harness />);
    const entries = agent
      .snapshot()
      .filter((entry) => !entry.offPage && entry.component !== "more");
    for (const entry of entries) {
      expect(
        entry.label,
        `${entry.component} ${entry.ref} has no name`,
      ).toBeTruthy();
    }
    const labels = entries.map((entry) => entry.label);
    for (const label of [
      "Title",
      "Speed",
      "Frames",
      "Accent",
      "Theme",
      "Loop",
    ]) {
      expect(labels, `${label} is missing from the snapshot`).toContain(label);
    }

    const result = await agent.act({
      steps: [
        { ref: "Title", action: "setValue", args: ["Atlas"] },
        { ref: "Speed", action: "setValue", args: [1.5] },
        { ref: "Frames", action: "setValue", args: [240] },
        { ref: "Accent", action: "setValue", args: ["#0000ff"] },
        { ref: "Theme", action: "setValue", args: ["light"] },
        { ref: "Loop", action: "setChecked", args: [true] },
      ],
    });
    expect(result.ok, result.error?.message).toBe(true);
    expect(latest).toMatchObject({
      title: "Atlas",
      speed: 1.5,
      frames: 240,
      accent: "#0000ff",
      theme: "light",
      loop: true,
    });
  });
});
