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
  ink: { type: "color", default: "", label: "Ink" },
  lines: {
    type: "list",
    default: ["First line", "Second line"],
    label: "Lines",
  },
  pair: {
    type: "list",
    default: ["Before", "After"],
    label: "Pair",
    min: 2,
    max: 2,
  },
  fontFamily: {
    type: "font",
    default: "Golos Text",
    options: ["Golos Text", "Inter", "Fraunces"],
    label: "Font",
  },
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

describe("Launch Pack controls", () => {
  test("an auto colour reads Auto until a colour is picked, and goes back", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const trigger = screen.getByRole("button", { name: "Ink" });
    expect(within(trigger).getByText("Auto")).toBeTruthy();
    await user.click(trigger);
    // Nothing to go back to yet.
    expect(screen.queryByRole("button", { name: "Ink: auto" })).toBeNull();
    const hex = screen.getByRole("textbox", { name: "Ink hex" });
    await user.clear(hex);
    await user.type(hex, "#ff0000{Enter}");
    expect(latest.ink).toBe("#ff0000");
    await user.click(await screen.findByRole("button", { name: "Ink: auto" }));
    expect(latest.ink).toBe("");
  });

  test("a list takes one item per line and keeps the line being typed", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const field = screen.getByLabelText("Lines") as HTMLTextAreaElement;
    expect(field.value).toBe("First line\nSecond line");
    await user.clear(field);
    await user.type(field, "One{Enter}");
    // The blank line being started stays in the field but not in the prop.
    expect(field.value).toBe("One\n");
    expect(latest.lines).toEqual(["One"]);
    await user.type(field, "{Enter}  Two  ");
    expect(latest.lines).toEqual(["One", "Two"]);
  });

  test("a fixed-length list keeps its length", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const field = screen.getByLabelText("Pair");
    expect(screen.getByText("2 lines")).toBeTruthy();
    await user.clear(field);
    await user.type(field, "Old{Enter}New{Enter}Extra");
    expect(latest.pair).toEqual(["Old", "New"]);
    await user.clear(field);
    await user.type(field, "Only");
    expect(latest.pair).toEqual(["Only", "After"]);
  });

  test("a font is picked from the component's face and the preview fonts", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole("combobox", { name: "Font" }));
    await user.click(screen.getByRole("option", { name: "Fraunces" }));
    expect(latest.fontFamily).toBe("Fraunces");
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
        { ref: "Lines", action: "setValue", args: ["Alpha\nBeta"] },
        { ref: "Font", action: "setValue", args: ["Inter"] },
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
      lines: ["Alpha", "Beta"],
      fontFamily: "Inter",
      title: "Atlas",
      speed: 1.5,
      frames: 240,
      accent: "#0000ff",
      theme: "light",
      loop: true,
    });
  });
});
