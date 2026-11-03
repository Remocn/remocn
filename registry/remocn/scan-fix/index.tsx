"use client";

import type { ReactNode } from "react";
import { AbsoluteFill } from "remotion";
import {
  AUDIT_COLORS,
  AuditClock,
  DEMO,
  DemoDashboard,
  easeInOut,
  FONT,
  IssueMarks,
  MeasureMarks,
  ScanBand,
  SplitAt,
  useAuditFrame,
  VersionChip,
} from "@/lib/remocn/audit-core";

export type ScanFixProps = {
  /** Frame before the fix, 1280x720. Defaults to the demo dashboard with red redlines. */
  before?: ReactNode;
  /** Frame after the fix, same size. Defaults to the fixed dashboard with blue redlines. */
  after?: ReactNode;
  /** Name next to the version chip. Empty hides the chip. */
  brand?: string;
  /** Version chip text before and after the band passes it. */
  versions?: [string, string];
  scanColor?: string;
  beforeColor?: string;
  afterColor?: string;
  background?: string;
  speed?: number;
};

export const scanFixDefaults = {
  brand: "Synergy",
  versions: ["v1.0", "v2.0"] as [string, string],
  scanColor: AUDIT_COLORS.scan,
  beforeColor: AUDIT_COLORS.audit,
  afterColor: AUDIT_COLORS.fix,
  background: AUDIT_COLORS.stage,
  speed: 1,
};

export const scanFixLength = 100;

const SCAN_START = 18;
const SCAN_LENGTH = 80;

export function ScanFix(props: ScanFixProps) {
  const { speed = 1 } = props;
  return (
    <AuditClock speed={speed}>
      <Scene {...props} />
    </AuditClock>
  );
}

function DemoBefore({ color }: { color: string }) {
  return (
    <>
      <DemoDashboard v={1} />
      <MeasureMarks
        measures={DEMO.before.measures}
        radii={DEMO.before.radii}
        color={color}
        start={-200}
      />
      <IssueMarks issues={DEMO.before.issues} color={color} start={-200} />
    </>
  );
}

function DemoAfter({ color }: { color: string }) {
  return (
    <>
      <DemoDashboard v={2} />
      <MeasureMarks
        measures={DEMO.after.measures}
        radii={DEMO.after.radii}
        color={color}
        start={-200}
      />
    </>
  );
}

function Scene({
  before,
  after,
  brand = scanFixDefaults.brand,
  versions = scanFixDefaults.versions,
  scanColor = scanFixDefaults.scanColor,
  beforeColor = scanFixDefaults.beforeColor,
  afterColor = scanFixDefaults.afterColor,
  background = scanFixDefaults.background,
}: ScanFixProps) {
  const frame = useAuditFrame();
  const y = easeInOut(
    frame,
    [SCAN_START, SCAN_START + SCAN_LENGTH],
    [-20, 760],
  );
  const band = easeInOut(
    frame,
    [
      SCAN_START - 4,
      SCAN_START + 2,
      SCAN_START + SCAN_LENGTH - 6,
      SCAN_START + SCAN_LENGTH + 2,
    ],
    [0, 1, 1, 0],
  );
  return (
    <AbsoluteFill style={{ background, fontFamily: FONT }}>
      <SplitAt
        y={y}
        bottom={before ?? <DemoBefore color={beforeColor} />}
        top={after ?? <DemoAfter color={afterColor} />}
      />
      {brand && (
        <VersionChip
          brand={brand}
          versions={versions}
          fixed={y > 36}
          colors={[beforeColor, afterColor]}
        />
      )}
      <ScanBand y={y} color={scanColor} opacity={band} />
    </AbsoluteFill>
  );
}
