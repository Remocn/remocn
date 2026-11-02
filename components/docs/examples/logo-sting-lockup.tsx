"use client";

/**
 * Neutral placeholder brand used by the logo-sting docs previews. Kept local to
 * the docs examples so they never import from the Studio shelves.
 */

const FONT_FAMILY =
  "var(--font-geist-sans), Inter, -apple-system, BlinkMacSystemFont, sans-serif";

const MARK = "#E5322D";
const INK = "#111111";

/** Wordmark only, for stings that draw their own mark. */
export function DemoWordmark({ color = "#FFFFFF" }: { color?: string }) {
  return (
    <span
      style={{
        fontFamily: FONT_FAMILY,
        fontSize: 104,
        fontWeight: 800,
        letterSpacing: "-0.04em",
        color,
      }}
    >
      remocn
    </span>
  );
}

/** Rounded red mark plus a wordmark, for stings that reveal a full lockup. */
export function DemoLockup({
  scale = 1,
  color = "#FFFFFF",
}: {
  scale?: number;
  color?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 28 * scale,
        transform: `scale(${scale})`,
      }}
    >
      <div
        style={{
          width: 120,
          height: 120,
          borderRadius: 32,
          backgroundColor: MARK,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            backgroundColor: INK,
          }}
        />
      </div>
      <DemoWordmark color={color} />
    </div>
  );
}

const LOGO_CHILD = `<Img src={staticFile("logo.svg")} style={{ height: 120 }} />`;

const WORDMARK_CHILD = `<span
      style={{
        fontSize: 104,
        fontWeight: 800,
        letterSpacing: "-0.04em",
        color: "#FFFFFF",
      }}
    >
      remocn
    </span>`;

function formatProp(key: string, value: unknown) {
  if (typeof value === "string") return `    ${key}="${value}"`;
  return `    ${key}={${JSON.stringify(value)}}`;
}

/**
 * Usage snippet for a logo sting that wraps its children. `child: "logo"` emits
 * an image lockup, `child: "wordmark"` a plain text wordmark for stings that
 * draw their own mark.
 */
export function logoStingCode({
  name,
  component,
  values,
  child,
}: {
  name: string;
  component: string;
  values: Record<string, unknown>;
  child: "logo" | "wordmark";
}): string {
  const props = Object.entries(values)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => formatProp(key, value))
    .join("\n");
  const imports =
    child === "logo" ? `import { Img, staticFile } from "remotion";\n` : "";
  const body = child === "logo" ? LOGO_CHILD : WORDMARK_CHILD;
  return `${imports}import { ${component} } from "@/components/remocn/${name}";

export const LogoSting = () => (
  <${component}
${props}
  >
    ${body}
  </${component}>
);`;
}
