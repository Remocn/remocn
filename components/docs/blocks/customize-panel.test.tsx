import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createAgent } from "@ui-sdk/react/agent";
import { useState } from "react";
import { beforeAll, describe, expect, test, vi } from "vitest";
import type { ControlConfig } from "@/lib/customizer-config";
import { CustomizePanel } from "./customize-panel";

vi.mock("@/lib/analytics", () => ({ useTrackEvent: () => () => {} }));

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
  loop: { type: "boolean", default: false, label: "Loop" },
  glow: { type: "boolean", default: true, label: "Glow" },
};
const defaults = { title: "Ship it", speed: 1, loop: false, glow: true };

let latest: Record<string, unknown> = {};
function Harness() {
  const [values, setValues] = useState<Record<string, unknown>>(defaults);
  latest = values;
  return (
    <CustomizePanel
      name="demo"
      controls={controls}
      values={values}
      code="<Demo />"
      isDefault={JSON.stringify(values) === JSON.stringify(defaults)}
      onChange={(key, value) =>
        setValues((prev) => ({ ...prev, [key]: value }))
      }
      onReset={() => setValues(defaults)}
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

describe("customize panel", () => {
  test("a group header collapses and reopens its controls", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const timing = screen.getByRole("button", { name: "Timing" });
    expect(timing.getAttribute("aria-expanded")).toBe("true");
    await user.click(timing);
    expect(timing.getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByRole("slider", { name: "Speed" })).toBeNull();
    await user.click(timing);
    expect(screen.getByRole("slider", { name: "Speed" })).toBeTruthy();
  });

  test("Reset is disabled at the defaults and restores them", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const reset = screen.getByRole("button", { name: "Reset" });
    expect(reset.hasAttribute("disabled")).toBe(true);
    await user.click(screen.getByText("Loop"));
    expect(latest.loop).toBe(true);
    expect(reset.hasAttribute("disabled")).toBe(false);
    await user.click(reset);
    expect(latest).toEqual(defaults);
  });

  test("Copy code copies the generated code", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole("button", { name: "Copy code" }));
    expect(await navigator.clipboard.readText()).toBe("<Demo />");
  });
});

describe("agent", () => {
  const agent = createAgent();

  test("an agent sees the panel's buttons and groups and can press them", async () => {
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
      "Reset",
      "Share link",
      "Copy code",
      "Content",
      "Timing",
      "Style",
    ]) {
      expect(labels, `${label} is missing from the snapshot`).toContain(label);
    }

    const changed = await agent.act({
      steps: [{ ref: "Loop", action: "setChecked", args: [true] }],
    });
    expect(changed.ok, changed.error?.message).toBe(true);
    const reset = await agent.act({
      steps: [{ ref: "Reset", action: "press", args: [] }],
    });
    expect(reset.ok, reset.error?.message).toBe(true);
    expect(latest).toEqual(defaults);
  });
});
