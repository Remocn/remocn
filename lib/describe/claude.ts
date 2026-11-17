import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import { MODEL } from "./policy";

export interface ModelReply {
  /** The parsed JSON answer, or null when there was none to read. */
  answer: unknown;
  /** The model declined on safety grounds. */
  refused: boolean;
  usage: { input_tokens: number; output_tokens: number };
}

export type AskModel = (input: {
  system: string;
  user: string;
  schema: Record<string, unknown>;
}) => Promise<ModelReply>;

let client: Anthropic | null | undefined;

/**
 * The describe field's model call, or null when `ANTHROPIC_API_KEY` is unset.
 *
 * Claude Haiku 5.5 with thinking off and low effort: the job is a lookup
 * from a sentence to a few prop values, and the answer is pinned to a JSON
 * schema (structured outputs), so a request can't get prose back. Haiku has
 * no server-side refusal fallback; a refusal counts as off-topic.
 */
export function modelCaller(): AskModel | null {
  if (client === undefined) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    client = apiKey
      ? new Anthropic({ apiKey, maxRetries: 1, timeout: 15_000 })
      : null;
  }
  const anthropic = client;
  if (!anthropic) return null;

  return async ({ system, user, schema }) => {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      thinking: { type: "disabled" },
      output_config: { effort: "low", format: { type: "json_schema", schema } },
      system,
      messages: [{ role: "user", content: user }],
    });
    const usage = {
      input_tokens: response.usage.input_tokens,
      output_tokens: response.usage.output_tokens,
    };
    if (response.stop_reason === "refusal") {
      return { answer: null, refused: true, usage };
    }
    if (response.stop_reason === "max_tokens") {
      return { answer: null, refused: false, usage };
    }
    const text = response.content.find((block) => block.type === "text");
    try {
      return {
        answer: text ? JSON.parse(text.text) : null,
        refused: false,
        usage,
      };
    } catch {
      return { answer: null, refused: false, usage };
    }
  };
}
