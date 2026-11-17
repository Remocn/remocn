import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createAgent } from "@ui-sdk/react/agent";
import { elementOf } from "@ui-sdk/react/observe";
import { useRef, useState } from "react";
import { beforeAll, describe, expect, test, vi } from "vitest";
import type { ChangeSource } from "@/lib/analytics";
import type { ControlConfig } from "@/lib/customizer-config";
import { CustomizePanel } from "../blocks/customize-panel";
import { ComponentCustomizer } from "../component-customizer";
import { tuneWithAgent } from "./tune";

vi.mock("@/lib/analytics", () => ({ useTrackEvent: () => () => {} }));
vi.mock("next/navigation", () => ({ usePathname: () => "/docs/demo" }));

const controls: ControlConfig = {
  title: { type: "text", default: "Ship", label: "Title" },
  speed: {
    type: "number",
    default: 1,
    min: 0.25,
    max: 4,
    step: 0.25,
    label: "Speed",
  },
  background: { type: "color", default: "", label: "Background" },
  ink: { type: "color", default: "", label: "Text color" },
  fontFamily: {
    type: "font",
    default: "Geist",
    options: ["Geist", "Inter", "Instrument Serif"],
    label: "Font",
  },
  grain: { type: "boolean", default: true, label: "Grain" },
};
const defaults = Object.fromEntries(
  Object.entries(controls).map(([key, control]) => [key, control.default]),
);

beforeAll(() => {
  // Reduced motion: the agent works at once, so the test needn't wait.
  window.matchMedia = ((query: string) => ({
    matches: query.includes("reduce"),
    media: query,
    addEventListener() {},
    removeEventListener() {},
  })) as unknown as typeof window.matchMedia;
  globalThis.fetch = vi.fn(
    async () => new Response("{}", { status: 404 }),
  ) as unknown as typeof fetch;
});

let latest: Record<string, unknown> = {};
let sources: (ChangeSource | undefined)[] = [];
let undoSteps = 0;

function Panel() {
  const [values, setValues] = useState<Record<string, unknown>>(defaults);
  latest = values;
  const batching = useRef(false);
  return (
    <CustomizePanel
      name="demo"
      controls={controls}
      values={values}
      code="<Demo />"
      isDefault={false}
      onChange={(key, value, source) => {
        sources.push(source);
        if (!batching.current) undoSteps++;
        setValues((prev) => ({ ...prev, [key]: value }));
      }}
      onReset={() => setValues(defaults)}
      onApply={(patch) => setValues((prev) => ({ ...prev, ...patch }))}
      batch={{
        begin: () => {
          batching.current = true;
          undoSteps++;
        },
        end: () => {
          batching.current = false;
        },
      }}
    />
  );
}

describe("agent tuning", () => {
  test("a preset is applied by the ui-sdk agent, as one undo step", async () => {
    sources = [];
    undoSteps = 0;
    render(<Panel />);
    await userEvent.click(
      await screen.findByRole("button", { name: "Editorial" }),
    );
    await waitFor(() =>
      expect(latest).toMatchObject({
        fontFamily: "Instrument Serif",
        speed: 0.75,
        background: "#fafafa",
        ink: "#0a0a0a",
      }),
    );
    expect(sources.length).toBeGreaterThan(0);
    expect(new Set(sources)).toEqual(new Set(["agent"]));
    expect(undoSteps).toBe(1);
  });

  test("opens a closed group, glides a slider and reports what it couldn't set", async () => {
    function Bare() {
      const [values, setValues] = useState<Record<string, unknown>>(defaults);
      latest = values;
      return (
        <div data-testid="root">
          <ComponentCustomizer
            controls={controls}
            values={values}
            onChange={(key, value) =>
              setValues((prev) => ({ ...prev, [key]: value }))
            }
          />
        </div>
      );
    }
    render(<Bare />);
    const bridge = createAgent();
    // A browser reports the controls of a closed group as off the page,
    // without refs to act on; jsdom has no layout to tell, so do it here.
    const agent = {
      act: bridge.act,
      snapshot: () =>
        bridge.snapshot().map((entry) => {
          const element = elementOf(entry.ref);
          const panel = element?.closest('[data-slot="collapsible-panel"]');
          return panel &&
            !panel.closest('[data-slot="collapsible"]')?.matches("[data-open]")
            ? { ...entry, offPage: true, actions: [] }
            : entry;
        }),
    };
    await agent.act({
      steps: [{ ref: "Timing", action: "setOpen", args: [false] }],
    });

    // Like a browser: the closed group's slider is off the page.
    expect(
      agent.snapshot().find((entry) => entry.label === "Speed")?.offPage,
    ).toBe(true);

    const seen: (string | null)[] = [];
    const missed = await tuneWithAgent({
      agent,
      root: screen.getByTestId("root"),
      controls,
      values: defaults,
      patch: {
        speed: 2.5,
        background: "#1b4d2e",
        fontFamily: "Instrument Serif",
        grain: false,
        missing: 1,
      },
      pace: { move: 1, glide: 1, settle: 0 },
      onStep: (element) => {
        const key =
          element?.closest<HTMLElement>("[data-control]")?.dataset.control;
        if (!element || (key && seen.at(-1) !== key)) seen.push(key ?? null);
      },
    });
    expect(latest).toMatchObject({
      speed: 2.5,
      background: "#1b4d2e",
      fontFamily: "Instrument Serif",
      grain: false,
    });
    expect(missed).toEqual({});
    expect(seen).toEqual(["speed", "background", "fontFamily", "grain", null]);
    // The agent opened the group it found closed, through the bridge.
    const timing = bridge
      .snapshot()
      .find(
        (entry) =>
          entry.component === "collapsible" && entry.label === "Timing",
      );
    expect(timing?.open).toBe(true);
  });
});
