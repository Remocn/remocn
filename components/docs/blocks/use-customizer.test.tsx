import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createAgent } from "@ui-sdk/react/agent";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { beforeAll, describe, expect, test, vi } from "vitest";
import type { ControlConfig } from "@/lib/customizer-config";
import { allowStep } from "../agent/bridge";
import { CustomizePanel } from "./customize-panel";
import { useCustomizer } from "./use-customizer";

const track = vi.hoisted(() => vi.fn());
vi.mock("@/lib/analytics", () => ({ useTrackEvent: () => track }));
vi.mock("next/navigation", () => ({ usePathname: () => "/docs/text/demo" }));

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

let latest: Record<string, unknown> = {};
function Panel() {
  const { values, isDefault, change, reset, ...history } = useCustomizer(
    "demo",
    controls,
  );
  latest = values;
  return (
    <CustomizePanel
      name="demo"
      controls={controls}
      values={values}
      code="<Demo />"
      isDefault={isDefault}
      onChange={change}
      onReset={reset}
      history={history}
    />
  );
}

function renderPanel() {
  return render(
    <NuqsTestingAdapter hasMemory>
      <Panel />
    </NuqsTestingAdapter>,
  );
}

const undoButton = () => screen.getByRole("button", { name: "Undo" });
const redoButton = () => screen.getByRole("button", { name: "Redo" });

beforeAll(() => {
  window.matchMedia ??= ((query: string) => ({
    matches: false,
    media: query,
    addEventListener() {},
    removeEventListener() {},
  })) as unknown as typeof window.matchMedia;
});

describe("undo and redo", () => {
  test("step back and forward through changes, a drag counting as one", async () => {
    const user = userEvent.setup();
    renderPanel();
    expect(undoButton().hasAttribute("disabled")).toBe(true);

    screen.getByRole("slider", { name: "Speed" }).focus();
    for (const speed of [1.1, 1.2, 1.3]) {
      await user.keyboard("{ArrowRight}");
      await waitFor(() => expect(latest.speed).toBe(speed));
    }
    await user.click(screen.getByText("Loop"));
    expect(latest).toMatchObject({ speed: 1.3, loop: true });

    await user.click(undoButton());
    expect(latest).toMatchObject({ speed: 1.3, loop: false });
    await user.click(undoButton());
    expect(latest).toMatchObject({ speed: 1, loop: false });
    expect(undoButton().hasAttribute("disabled")).toBe(true);

    await user.click(redoButton());
    await user.click(redoButton());
    expect(latest).toMatchObject({ speed: 1.3, loop: true });
    expect(redoButton().hasAttribute("disabled")).toBe(true);
  });

  test("a reset comes back in one step", async () => {
    const user = userEvent.setup();
    renderPanel();
    await user.click(screen.getByText("Loop"));
    await user.click(screen.getByText("Glow"));
    await user.click(screen.getByRole("button", { name: "Reset" }));
    expect(latest).toMatchObject({ loop: false, glow: true });
    await user.click(undoButton());
    expect(latest).toMatchObject({ loop: true, glow: false });
  });

  test("Cmd+Z and Shift+Cmd+Z work from a control, not inside a text field", async () => {
    const user = userEvent.setup();
    renderPanel();
    await user.click(screen.getByText("Loop"));
    await user.keyboard("{Meta>}z{/Meta}");
    expect(latest.loop).toBe(false);
    await user.keyboard("{Meta>}{Shift>}z{/Shift}{/Meta}");
    expect(latest.loop).toBe(true);

    await user.click(screen.getByLabelText("Title"));
    await user.keyboard("{Control>}z{/Control}");
    expect(latest.loop).toBe(true);
  });
});

describe("agent", () => {
  const agent = createAgent({ allow: allowStep });

  test("an agent can undo its own change", async () => {
    renderPanel();
    const changed = await agent.act({
      steps: [{ ref: "Speed", action: "setValue", args: [0.5] }],
    });
    expect(changed.ok, changed.error?.message).toBe(true);
    await waitFor(() => expect(latest.speed).toBe(0.5));
    const undone = await agent.act({
      steps: [{ ref: "Undo", action: "press", args: [] }],
    });
    expect(undone.ok, undone.error?.message).toBe(true);
    await act(async () => {});
    expect(latest.speed).toBe(1);
  });
});

describe("analytics", () => {
  const agent = createAgent({ allow: allowStep });

  test("a customize event says who made the change", async () => {
    const user = userEvent.setup();
    renderPanel();
    track.mockClear();
    screen.getByRole("slider", { name: "Speed" }).focus();
    await user.keyboard("{ArrowRight}");
    await agent.act({
      steps: [{ ref: "Loop", action: "setChecked", args: [true] }],
    });
    // jsdom's events aren't trusted, so ui-sdk calls the key press
    // "programmatic" here; a browser reports "keyboard".
    await waitFor(
      () => {
        expect(track).toHaveBeenCalledWith(
          "component_customized",
          expect.objectContaining({ component: "demo", prop: "speed" }),
        );
        expect(track).toHaveBeenCalledWith("component_customized", {
          component: "demo",
          prop: "loop",
          source: "agent",
        });
      },
      { timeout: 2000 },
    );
  });
});
