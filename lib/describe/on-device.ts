"use client";

/**
 * The browser's built-in model (Chrome's Prompt API, `LanguageModel`), as a
 * free tier between the presets and the server's model. Used only when it is
 * already downloaded: asking for "downloadable" would start a multi-gigabyte
 * download on a docs page. Everything here is feature-detected and any
 * failure just means the server answers instead.
 */

type Availability =
  | "unavailable"
  | "downloadable"
  | "downloading"
  | "available";

interface LanguageModelSession {
  prompt(
    input: string,
    options?: { responseConstraint?: unknown; signal?: AbortSignal },
  ): Promise<string>;
  destroy(): void;
}

interface LanguageModelApi {
  availability(options?: unknown): Promise<Availability>;
  create(options?: unknown): Promise<LanguageModelSession>;
}

function api(): LanguageModelApi | null {
  const candidate = (globalThis as { LanguageModel?: LanguageModelApi })
    .LanguageModel;
  return candidate && typeof candidate.availability === "function"
    ? candidate
    : null;
}

/** The request's language, as the Prompt API's options name it. */
export function languageOf(text: string): string {
  return /\p{Script=Cyrillic}/u.test(text) ? "ru" : "en";
}

const options = (language: string) => ({
  expectedInputs: [{ type: "text", languages: ["en", language] }],
  expectedOutputs: [{ type: "text", languages: ["en"] }],
});

const ready = new Map<string, Promise<boolean>>();

export function deviceModelReady(language: string): Promise<boolean> {
  let pending = ready.get(language);
  if (!pending) {
    const model = api();
    pending = model
      ? model
          .availability(options(language))
          .then((state) => state === "available")
          .catch(() => false)
      : Promise.resolve(false);
    ready.set(language, pending);
  }
  return pending;
}

/** The model's JSON answer, or null when it gave none. */
export async function askDeviceModel(input: {
  system: string;
  user: string;
  schema: Record<string, unknown>;
  language: string;
  signal?: AbortSignal;
}): Promise<unknown> {
  const model = api();
  if (!model) return null;
  let session: LanguageModelSession | undefined;
  try {
    session = await model.create({
      ...options(input.language),
      initialPrompts: [{ role: "system", content: input.system }],
      signal: input.signal,
    });
    const text = await session.prompt(input.user, {
      responseConstraint: input.schema,
      signal: input.signal,
    });
    return JSON.parse(text);
  } catch {
    return null;
  } finally {
    session?.destroy();
  }
}
