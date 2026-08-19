import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { StudioElementPayload } from "@remotion/studio-protocol";
import { ComponentPreview } from "@/components/docs/component-preview";

const ELEMENTS_DIR = join(process.cwd(), "registry-artifacts", "elements");

function loadStudioElement(name: string): StudioElementPayload | undefined {
  if (!/^[a-z0-9-]+$/.test(name)) return undefined;
  const file = join(ELEMENTS_DIR, `${name}.json`);
  if (!existsSync(file)) return undefined;
  return JSON.parse(readFileSync(file, "utf8")) as StudioElementPayload;
}

export function ComponentPreviewMdx({ name }: { name: string }) {
  return (
    <ComponentPreview name={name} studioElement={loadStudioElement(name)} />
  );
}
