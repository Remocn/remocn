import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { after, NextResponse } from "next/server";
import { trackRegistryInstall } from "@/lib/server/analytics";

// Node runtime: the payloads are read off disk from the committed build output.
export const runtime = "nodejs";
// Never cached: an install is only counted if the request reaches this handler.
export const dynamic = "force-dynamic";

const ARTIFACTS_DIR = join(process.cwd(), "registry-artifacts");

const ARTIFACT_FILE = /^[a-z0-9][a-z0-9-]*\.json$/;

const NON_COMPONENT_ARTIFACTS = new Set(["registry.json"]);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ file: string }> },
) {
  const { file } = await params;

  if (!ARTIFACT_FILE.test(file)) return notFound();

  let payload: string;
  try {
    payload = await readFile(join(ARTIFACTS_DIR, file), "utf8");
  } catch {
    return notFound();
  }

  if (!NON_COMPONENT_ARTIFACTS.has(file)) {
    const component = file.slice(0, -".json".length);
    const userAgent = request.headers.get("user-agent") ?? "";
    after(() => trackRegistryInstall(component, userAgent));
  }

  return new NextResponse(payload, {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

function notFound() {
  return NextResponse.json(
    { error: "Unknown registry item.", code: "not_found" },
    { status: 404 },
  );
}
