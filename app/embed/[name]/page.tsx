import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { previewManifest } from "@/registry/__manifest__";
import { EmbedPlayer } from "./embed-player";

/**
 * Chrome-less player for one registry component, made to be iframed — the MCP
 * App view behind `preview_component` / `plan_video` loads it. Optional
 * `?props=<url-encoded JSON>` is merged over the component's demo defaults.
 */

export const metadata: Metadata = {
  title: "Embed",
  robots: { index: false, follow: false },
};

const MAX_PROPS_JSON = 4000;

function parseProps(
  raw: string | string[] | undefined,
): Record<string, unknown> {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value || value.length > MAX_PROPS_JSON) return {};
  try {
    const parsed: unknown = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

export default async function EmbedPage({
  params,
  searchParams,
}: {
  params: Promise<{ name: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { name } = await params;
  // `name` comes from the URL: `constructor` or `toString` must 404, not
  // resolve to an Object.prototype member.
  if (!Object.hasOwn(previewManifest, name)) notFound();
  const entry = previewManifest[name];
  const props = parseProps((await searchParams).props);

  return (
    <main className="flex min-h-dvh w-full items-center justify-center bg-background">
      <EmbedPlayer
        name={name}
        inputProps={{ ...entry.defaults, ...props }}
        durationInFrames={entry.durationInFrames}
        fps={entry.fps}
        compositionWidth={entry.compositionWidth}
        compositionHeight={entry.compositionHeight}
        previewBackdrop={entry.previewBackdrop}
      />
    </main>
  );
}
