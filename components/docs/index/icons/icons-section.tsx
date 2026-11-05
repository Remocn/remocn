import type { ReactNode } from "react";
import { IndexSection } from "../index-section";
import { ICONS } from "./icons";

/** "Gallery" header with the icon count; the `<IconsGallery />` follows it. */
export function IconsSection({ children }: { children: ReactNode }) {
  return (
    <IndexSection heading={children} count={ICONS.length}>
      {null}
    </IndexSection>
  );
}
