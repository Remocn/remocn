import { AuditBoxes, auditBoxesLength } from "@/registry/remocn/audit-boxes";
import { DesignAudit, designAuditLength } from "@/registry/remocn/design-audit";
import {
  LayoutGuides,
  layoutGuidesLength,
} from "@/registry/remocn/layout-guides";
import {
  RedlineMeasure,
  redlineMeasureLength,
} from "@/registry/remocn/redline-measure";
import { ScanFix, scanFixLength } from "@/registry/remocn/scan-fix";
import { TokenTags, tokenTagsLength } from "@/registry/remocn/token-tags";
import type { DraftEntry } from "../motion-pack/shared";

/** Each scene holds a beat past its own motion so the end state reads. */
const HOLD = 27;

export const designAuditDrafts: DraftEntry[] = [
  {
    id: "design-audit",
    component: DesignAudit,
    durationInFrames: designAuditLength + 8,
  },
  {
    id: "redline-measure",
    component: RedlineMeasure,
    durationInFrames: redlineMeasureLength + HOLD,
  },
  {
    id: "audit-boxes",
    component: AuditBoxes,
    durationInFrames: auditBoxesLength + HOLD,
  },
  {
    id: "scan-fix",
    component: ScanFix,
    durationInFrames: scanFixLength + HOLD,
  },
  {
    id: "token-tags",
    component: TokenTags,
    durationInFrames: tokenTagsLength + HOLD,
  },
  {
    id: "layout-guides",
    component: LayoutGuides,
    durationInFrames: layoutGuidesLength + HOLD,
  },
];
