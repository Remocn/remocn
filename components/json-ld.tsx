import { serializeJsonLd } from "@/lib/structured-data";

/** Structured data for search engines and agents (schema.org JSON-LD). */
export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: escaped JSON, the pattern from Next's JSON-LD guide
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
