import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createAgent } from "@ui-sdk/react/agent";
import { useState } from "react";
import { describe, expect, test, vi } from "vitest";
import type { ControlConfig } from "@/lib/customizer-config";
import type { DeviceModel, Post } from "@/lib/describe/client";
import type { DescribeResponse, Preset } from "@/lib/describe/types";
import { DescribeField } from "./describe-field";

vi.mock("@/lib/analytics", () => ({ useTrackEvent: () => () => {} }));

const controls: ControlConfig = {
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
};
const defaults = { speed: 1, background: "", ink: "" };

const neon: Preset = {
  id: "neon",
  label: "Neon",
  description: "Glow on black.",
  askedAs: [],
  props: { speed: 2, background: "#000000", unknown: 1 },
};

let latest: Record<string, unknown> = {};
function Harness({
  post,
  device = null,
}: {
  post: Post;
  device?: DeviceModel | null;
}) {
  const [values, setValues] = useState<Record<string, unknown>>(defaults);
  latest = values;
  return (
    <DescribeField
      name="demo"
      controls={controls}
      values={values}
      onApply={(patch) => setValues((prev) => ({ ...prev, ...patch }))}
      post={post}
      device={device}
      loadPresets={async () => [neon]}
    />
  );
}

const reply = (result: Partial<DescribeResponse>): Post =>
  vi.fn(async () => ({
    patch: {},
    tier: null,
    understood: false,
    ai: "skipped" as const,
    ...result,
  }));

describe("describe field", () => {
  test("applies the server's patch and says what changed", async () => {
    const post = reply({
      patch: { speed: 0.75 },
      tier: "literal",
      understood: true,
    });
    render(<Harness post={post} />);
    await userEvent.type(screen.getByLabelText("Describe"), "slower{Enter}");
    await waitFor(() => expect(latest.speed).toBe(0.75));
    expect(screen.getByText("Speed 0.75")).toBeTruthy();
    expect(post).toHaveBeenCalledWith(
      expect.objectContaining({ name: "demo", text: "slower", mode: "auto" }),
    );
  });

  test("an applied request clears the field and can be picked again from the history", async () => {
    localStorage.clear();
    const post = reply({
      patch: { speed: 0.75 },
      tier: "literal",
      understood: true,
    });
    render(<Harness post={post} />);
    const field = screen.getByLabelText("Describe") as HTMLInputElement;
    await userEvent.type(field, "slower{Enter}");
    await waitFor(() => expect(field.value).toBe(""));
    await userEvent.click(screen.getByRole("button", { name: /History/ }));
    await userEvent.click(screen.getByRole("button", { name: /slower/ }));
    expect(field.value).toBe("slower");
    expect(
      JSON.parse(localStorage.getItem("remocn:describe-history") ?? "[]"),
    ).toEqual([{ text: "slower", summary: "Speed 0.75" }]);
  });

  test("an off-topic request changes nothing and says what the field is for", async () => {
    render(<Harness post={reply({ ai: "rejected" })} />);
    await userEvent.type(
      screen.getByLabelText("Describe"),
      "write a poem{Enter}",
    );
    expect(
      await screen.findByText(/only changes how the animation looks/),
    ).toBeTruthy();
    expect(latest).toEqual(defaults);
  });

  test("a banned visitor still gets what the parser read", async () => {
    const post = reply({
      patch: { speed: 0.75 },
      tier: "literal",
      ai: "banned",
    });
    render(<Harness post={post} />);
    await userEvent.type(
      screen.getByLabelText("Describe"),
      "slower with wobble{Enter}",
    );
    expect(await screen.findByText(/off for this network/)).toBeTruthy();
    expect(latest.speed).toBe(0.75);
  });

  test("the browser's model answers when it can, and the server's is not asked", async () => {
    const post = reply({ device: { system: "s", schema: {} } });
    const device: DeviceModel = {
      ready: async () => true,
      language: () => "en",
      ask: async () => ({
        on_topic: true,
        changes: [{ prop: "speed", value: 3 }],
      }),
    };
    render(<Harness post={post} device={device} />);
    await userEvent.type(
      screen.getByLabelText("Describe"),
      "way faster{Enter}",
    );
    await waitFor(() => expect(latest.speed).toBe(3));
    expect(post).toHaveBeenCalledTimes(1);
    expect(post).toHaveBeenCalledWith(
      expect.objectContaining({ mode: "free" }),
    );
  });

  test("a preset chip applies only the props the component has", async () => {
    render(<Harness post={reply({})} />);
    await userEvent.click(await screen.findByRole("button", { name: "Neon" }));
    expect(latest).toEqual({ speed: 2, background: "#000000", ink: "" });
  });

  test("moods are offered as chips too", async () => {
    render(<Harness post={reply({})} />);
    await userEvent.click(await screen.findByRole("button", { name: "Dark" }));
    expect(latest).toEqual({ speed: 1, background: "#0a0a0a", ink: "#fafafa" });
  });

  test("the agent bridge can't see the field", () => {
    render(<Harness post={reply({})} />);
    const labels = createAgent()
      .snapshot()
      .map((entry) => entry.label);
    expect(labels).not.toContain("Describe");
    expect(labels).not.toContain("Apply");
  });
});
