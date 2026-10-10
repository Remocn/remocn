import { writeFile } from "node:fs/promises";
import path from "node:path";
import { type NextRequest, NextResponse } from "next/server";

const TARGET = path.join(
  process.cwd(),
  "app",
  "lab",
  "hero-shader",
  "saved.json",
);

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return new NextResponse("Not found", { status: 404 });
  }

  const body = await request.json();
  await writeFile(TARGET, `${JSON.stringify(body, null, 2)}\n`, "utf8");

  return NextResponse.json({ path: path.relative(process.cwd(), TARGET) });
}
