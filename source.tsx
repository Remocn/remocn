import {
  ArtificialIntelligence04Icon,
  Award01Icon,
  BlurIcon,
  BookOpen01Icon,
  ClosedCaptionIcon,
  ColorsIcon,
  DashboardSquare01Icon,
  GeometricShapes01Icon,
  Layers01Icon,
  Layout01Icon,
  MagicWand01Icon,
  PaintBoardIcon,
  Rocket01Icon,
  Share01Icon,
  SparklesIcon,
  TextFontIcon,
  ToggleOnIcon,
  TransitionRightIcon,
  Video01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { loader } from "fumadocs-core/source";
import { docs } from "@/.source/server";

/** Sidebar category icons — meta.json `icon` values resolve against this map. */
const DOCS_ICONS: Record<string, IconSvgElement> = {
  ArtificialIntelligence04Icon,
  Award01Icon,
  BlurIcon,
  BookOpen01Icon,
  ClosedCaptionIcon,
  ColorsIcon,
  DashboardSquare01Icon,
  GeometricShapes01Icon,
  Layers01Icon,
  Layout01Icon,
  MagicWand01Icon,
  PaintBoardIcon,
  Rocket01Icon,
  Share01Icon,
  SparklesIcon,
  TextFontIcon,
  ToggleOnIcon,
  TransitionRightIcon,
  Video01Icon,
};

export const source = loader({
  baseUrl: "/docs",
  icon(icon) {
    if (!icon) return;
    const svg = DOCS_ICONS[icon];
    if (!svg) return;
    return <HugeiconsIcon icon={svg} strokeWidth={1.8} />;
  },
  source: docs.toFumadocsSource(),
});
