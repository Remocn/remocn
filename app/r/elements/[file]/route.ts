import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { NextResponse } from "next/server";

// Remotion Studio element payloads (`registry-artifacts/elements/*.json`),
// fetched by the icon gallery and the caption picker when someone installs or
// drags an item. Read off disk on request so the 600+ payloads never enter a
// bundle: a dynamic `import()` over the folder made the bundler compile every
// one of them for both the browser and SSR on the first docs request.
export const runtime = "nodejs";

const ELEMENTS_DIR = join(process.cwd(), "registry-artifacts", "elements");

const ELEMENT_FILE = /^[a-z0-9][a-z0-9-]*\.json$/;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ file: string }> },
) {
  const { file } = await params;
  if (!ELEMENT_FILE.test(file)) return notFound();

  let payload: string;
  try {
    payload = await readFile(join(ELEMENTS_DIR, file), "utf8");
  } catch {
    return notFound();
  }

  return new NextResponse(payload, {
    headers: {
      "content-type": "application/json; charset=utf-8",
      // Payloads change only with a deploy.
      "cache-control": "public, max-age=3600",
    },
  });
}

function notFound() {
  return NextResponse.json(
    { error: "Unknown element.", code: "not_found" },
    { status: 404 },
  );
}
