import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  ELEMENT_PAYLOAD_MIME_TYPE,
  type StudioElementPayload,
  serializeElementPayloadForHtml,
} from "@remotion/studio-protocol";
import { ComponentPreview } from "@/components/docs/component-preview";

const ELEMENTS_DIR = join(process.cwd(), "registry-artifacts", "elements");

function loadStudioElement(name: string): StudioElementPayload | undefined {
  if (!/^[a-z0-9-]+$/.test(name)) return undefined;
  const file = join(ELEMENTS_DIR, `${name}.json`);
  if (!existsSync(file)) return undefined;
  return JSON.parse(readFileSync(file, "utf8")) as StudioElementPayload;
}

export function ComponentPreviewMdx({ name }: { name: string }) {
  const studioElement = loadStudioElement(name);
  return (
    <>
      {studioElement ? (
        // Lets `npx remotion elements use <page URL>` install this component.
        <script
          type={ELEMENT_PAYLOAD_MIME_TYPE}
          // biome-ignore lint/security/noDangerouslySetInnerHtml: serializeElementPayloadForHtml escapes the JSON for a <script> tag
          dangerouslySetInnerHTML={{
            __html: serializeElementPayloadForHtml(studioElement),
          }}
        />
      ) : null}
      <ComponentPreview
        name={name}
        studioElement={studioElement}
        layout={null}
      />
    </>
  );
}
