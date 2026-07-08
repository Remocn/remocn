"use client";

import { AbsoluteFill } from "remotion";
import { Drift } from "@/registry/remocn/drift";

const FONT_FAMILY =
  "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif";

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div
        style={{
          fontFamily: FONT_FAMILY,
          fontSize: 32,
          fontWeight: 600,
          color: "#f2f2f2",
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontFamily: FONT_FAMILY,
          fontSize: 16,
          color: "#8a8794",
        }}
      >
        {label}
      </div>
    </div>
  );
}

function ReportCard() {
  return (
    <div
      style={{
        background: "#1a1922",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 24,
        padding: "48px 56px",
        maxWidth: 720,
      }}
    >
      <div
        style={{
          fontFamily: FONT_FAMILY,
          fontSize: 56,
          fontWeight: 600,
          color: "#f2f2f2",
        }}
      >
        Quarterly Report
      </div>
      <div
        style={{
          fontFamily: FONT_FAMILY,
          fontSize: 24,
          color: "#8a8794",
          marginTop: 16,
        }}
      >
        Revenue grew across every region this quarter.
      </div>
      <div
        style={{
          fontFamily: FONT_FAMILY,
          fontSize: 24,
          color: "#8a8794",
        }}
      >
        Customer retention held steady above target.
      </div>
      <div
        style={{
          display: "flex",
          gap: 40,
          marginTop: 32,
        }}
      >
        <Stat value="+18%" label="Revenue" />
        <Stat value="94%" label="Retention" />
      </div>
    </div>
  );
}

export function DriftExampleScene({ grow }: { grow?: number }) {
  return (
    <Drift grow={grow}>
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ReportCard />
      </AbsoluteFill>
    </Drift>
  );
}

export const driftExampleCode = (values: Record<string, unknown>): string => {
  const grow = (values.grow as number) ?? 0.035;
  return `import { Drift } from "@/components/remocn/drift";

export const MyScene = () => (
  <Drift grow={${grow}}>
    <YourScene />
  </Drift>
);`;
};
