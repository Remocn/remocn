import {
  ArtificialIntelligence04Icon,
  BlurIcon,
  BookOpen01Icon,
  ColorsIcon,
  DashboardSquare01Icon,
  Layers01Icon,
  Layout01Icon,
  MagicWand01Icon,
  Rocket01Icon,
  Share01Icon,
  SparklesIcon,
  TextFontIcon,
  ToggleOnIcon,
  TransitionRightIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { loader } from "fumadocs-core/source";
import { docs } from "@/.source/server";

/** Sidebar category icons — meta.json `icon` values resolve against this map. */
const DOCS_ICONS: Record<string, IconSvgElement> = {
  ArtificialIntelligence04Icon,
  BlurIcon,
  BookOpen01Icon,
  ColorsIcon,
  DashboardSquare01Icon,
  Layers01Icon,
  Layout01Icon,
  MagicWand01Icon,
  Rocket01Icon,
  Share01Icon,
  SparklesIcon,
  TextFontIcon,
  ToggleOnIcon,
  TransitionRightIcon,
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
