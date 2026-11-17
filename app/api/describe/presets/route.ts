import { loadControls } from "@/lib/describe/controls-server";
import { loadPresets } from "@/lib/describe/presets-server";

export const runtime = "nodejs";

/**
 * GET /api/describe/presets?name=<component> — the component's own presets,
 * for the chips under the describe field. The shared moods are computed in
 * the browser (lib/describe/moods.ts).
 */
export async function GET(request: Request) {
  const name = new URL(request.url).searchParams.get("name");
  const controls = name ? await loadControls(name) : null;
  if (!name || !controls) {
    return Response.json({ error: "Unknown component." }, { status: 404 });
  }
  const presets = await loadPresets(name, controls);
  return Response.json(
    { presets },
    {
      headers: {
        "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
      },
    },
  );
}
