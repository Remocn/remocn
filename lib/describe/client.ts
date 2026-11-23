import type { ControlConfig } from "@/lib/customizer-config";
import { readAnswer, userTurn } from "./model-schema";
import { changedOnly, sanitizePatch } from "./patch";
import type { DescribeRequest, DescribeResponse } from "./types";

export interface DeviceModel {
  ready: (language: string) => Promise<boolean>;
  ask: (input: {
    system: string;
    user: string;
    schema: Record<string, unknown>;
    language: string;
  }) => Promise<unknown>;
  language: (text: string) => string;
}

export type Post = (body: DescribeRequest) => Promise<DescribeResponse>;

export const postDescribe: Post = async (body) => {
  const response = await fetch("/api/describe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const { error } = (await response.json().catch(() => ({}))) as {
      error?: string;
    };
    throw new Error(error ?? `Request failed (${response.status})`);
  }
  return response.json();
};

/**
 * One describe request from the browser. With a built-in model on hand the
 * server is asked for its free tiers only, and the browser's model takes the
 * rest; otherwise, or when that model fails, the server goes on to its own.
 * The patch comes back limited to the controls this panel shows.
 */
export async function runDescribe(input: {
  name: string;
  text: string;
  values: Record<string, unknown>;
  controls: ControlConfig;
  post?: Post;
  device?: DeviceModel | null;
}): Promise<DescribeResponse> {
  const { name, text, values, controls, device } = input;
  const post = input.post ?? postDescribe;
  const language = device?.language(text) ?? "en";
  const local = device
    ? await device.ready(language).catch(() => false)
    : false;

  let result = await post({
    name,
    text,
    values,
    mode: local ? "free" : "auto",
  });

  if (local && device && result.device) {
    const raw = await device.ask({
      system: result.device.system,
      user: userTurn(text, values, controls),
      schema: result.device.schema,
      language,
    });
    const answer = readAnswer(controls, raw);
    if (answer && !answer.onTopic) {
      result = { patch: {}, tier: null, understood: false, ai: "rejected" };
    } else if (answer && Object.keys(answer.patch).length > 0) {
      result = {
        patch: changedOnly({ ...answer.patch, ...result.patch }, values),
        tier: "device",
        understood: true,
        ai: "skipped",
      };
    } else {
      result = await post({ name, text, values, mode: "auto" });
    }
  }

  const { device: _, ...rest } = result;
  return {
    ...rest,
    patch: changedOnly(
      sanitizePatch(controls, result.patch, { allowText: true }),
      values,
    ),
  };
}

const AI_NOTE: Partial<Record<DescribeResponse["ai"], string>> = {
  banned: "AI tuning is off for this network.",
  limited: "You've used today's AI requests.",
  budget: "AI tuning is resting until tomorrow.",
  off: "AI tuning isn't available right now.",
  error: "AI tuning isn't available right now.",
};

function formatValue(value: unknown): string {
  if (typeof value === "boolean") return value ? "on" : "off";
  if (value === "") return "auto";
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
}

/** What the field says after a request. */
export function describeStatus(
  result: DescribeResponse,
  controls: ControlConfig,
): { tone: "done" | "partial" | "rejected"; text: string } {
  if (result.ai === "rejected") {
    return {
      tone: "rejected",
      text: "This field only changes how the animation looks: describe its colours, speed, size or type.",
    };
  }
  const changes = Object.entries(result.patch)
    .map(
      ([key, value]) => `${controls[key]?.label || key} ${formatValue(value)}`,
    )
    .join(" · ");
  const matched = result.match ? `${result.match.label}: ` : "";
  if (result.understood) {
    return changes
      ? { tone: "done", text: `${matched}${changes}` }
      : { tone: "done", text: "It already looks like that." };
  }
  const note = AI_NOTE[result.ai];
  if (changes) {
    return {
      tone: "partial",
      text: `Applied what I could read: ${changes}.${note ? ` ${note}` : ""}`,
    };
  }
  return {
    tone: "partial",
    text: `${note ? `${note} ` : ""}Try words like “slower”, “dark background”, “serif”, or a preset.`,
  };
}
