"use client";

import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

export interface CodeAccordionProps {
  lines?: string[];
  collapseRange?: [number, number];
  collapseAt?: number;
  title?: string;
  fontSize?: number;
  width?: number;
  cardColor?: string;
  textColor?: string;
  mutedColor?: string;
  speed?: number;
  className?: string;
}

const FONT_MONO =
  "var(--font-geist-mono), ui-monospace, SFMono-Regular, monospace";

const DEFAULT_LINES = [
  "export function processOrders(orders) {",
  "  const valid = [];",
  "  for (const order of orders) {",
  "    if (!order.id) continue;",
  "    if (!order.customer) continue;",
  "    if (!order.items?.length) continue;",
  "    if (order.total <= 0) continue;",
  "    if (order.status === 'cancelled') continue;",
  "    if (order.status === 'refunded') continue;",
  "    const enriched = enrich(order);",
  "    const validated = validate(enriched);",
  "    if (!validated.ok) continue;",
  "    const priced = price(validated.value);",
  "    const taxed = applyTax(priced);",
  "    const shipped = applyShipping(taxed);",
  "    valid.push(shipped);",
  "  }",
  "  return valid;",
  "}",
];

export function CodeAccordion({
  lines = DEFAULT_LINES,
  collapseRange = [3, 14],
  collapseAt = 30,
  title = "process-orders.ts",
  fontSize = 16,
  width = 720,
  cardColor = "#0a0a0a",
  textColor = "#e4e4e7",
  mutedColor = "#52525b",
  speed = 1,
  className,
}: CodeAccordionProps) {
  const frame = useCurrentFrame() * speed;
  const { fps } = useVideoConfig();

  const lineHeight = Math.round(fontSize * 1.55);
  const [start, end] = collapseRange;
  const collapsedCount = Math.max(0, end - start + 1);

  // Spring drives BOTH the inner collapse height AND a tiny y-bounce on the
  // window so the accordion feels like it has weight.
  const collapseProgress = spring({
    frame: frame - collapseAt,
    fps,
    config: { damping: 10, stiffness: 110, mass: 1 },
  });

  const collapsedHeight = interpolate(
    collapseProgress,
    [0, 1],
    [collapsedCount * lineHeight, lineHeight], // collapses down to the placeholder bar's height
  );

  const collapsedOpacity = interpolate(collapseProgress, [0, 0.6], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const placeholderOpacity = interpolate(collapseProgress, [0.4, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const before = lines.slice(0, start);
  const collapsed = lines.slice(start, end + 1);
  const after = lines.slice(end + 1);

  return (
    <div
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: FONT_MONO,
      }}
    >
      <div
        style={{
          width,
          background: cardColor,
          borderRadius: 14,
          overflow: "hidden",
          boxShadow:
            "0 30px 80px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {/* Chrome */}
        <div
          style={{
            height: 38,
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "0 14px",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <Light color="#ff5f57" />
          <Light color="#febc2e" />
          <Light color="#28c840" />
          <div
            style={{
              flex: 1,
              textAlign: "center",
              color: mutedColor,
              fontSize: 12,
            }}
          >
            {title}
          </div>
        </div>

        {/* Code body */}
        <div style={{ padding: "16px 0", fontSize, lineHeight: 1.55 }}>
          {before.map((line, i) => (
            <Line
              key={`b-${i}`}
              line={line}
              index={i}
              lineHeight={lineHeight}
              textColor={textColor}
              mutedColor={mutedColor}
            />
          ))}

          {/* Collapsing region */}
          <div
            style={{
              position: "relative",
              height: collapsedHeight,
              overflow: "hidden",
              transition: "none",
            }}
          >
            <div style={{ opacity: collapsedOpacity }}>
              {collapsed.map((line, i) => (
                <Line
                  key={`c-${i}`}
                  line={line}
                  index={start + i}
                  lineHeight={lineHeight}
                  textColor={textColor}
                  mutedColor={mutedColor}
                />
              ))}
            </div>

            {/* Placeholder bar — sits at the bottom so it sits on the same
                baseline as the collapsed-into row. */}
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,
                height: lineHeight,
                display: "flex",
                alignItems: "center",
                paddingLeft: 56,
                color: mutedColor,
                fontStyle: "italic",
                opacity: placeholderOpacity,
              }}
            >
              ⋯ {collapsedCount} lines collapsed
            </div>
          </div>

          {after.map((line, i) => (
            <Line
              key={`a-${i}`}
              line={line}
              index={end + 1 + i}
              lineHeight={lineHeight}
              textColor={textColor}
              mutedColor={mutedColor}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function Light({ color }: { color: string }) {
  return (
    <div
      style={{
        width: 11,
        height: 11,
        borderRadius: "50%",
        background: color,
        opacity: 0.6,
      }}
    />
  );
}

function Line({
  line,
  index,
  lineHeight,
  textColor,
  mutedColor,
}: {
  line: string;
  index: number;
  lineHeight: number;
  textColor: string;
  mutedColor: string;
}) {
  return (
    <div
      style={{
        height: lineHeight,
        display: "flex",
        alignItems: "center",
        whiteSpace: "pre",
        color: textColor,
      }}
    >
      <span
        style={{
          width: 56,
          textAlign: "right",
          paddingRight: 16,
          color: mutedColor,
          userSelect: "none",
        }}
      >
        {index + 1}
      </span>
      <span>{line}</span>
    </div>
  );
}
