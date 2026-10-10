"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  MEGA_MENU_SECTIONS,
  type MegaMenuItem,
  type MegaMenuSection,
} from "@/config/mega-menu";
import { cn } from "@/lib/utils";

const MegaMenuPreview = dynamic(() => import("./mega-menu-preview"), {
  ssr: false,
});

const OPEN_SPRING = {
  type: "spring",
  stiffness: 520,
  damping: 40,
} as const;
const SLIDE_SPRING = {
  type: "spring",
  stiffness: 480,
  damping: 44,
} as const;

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export function MegaMenuPanel({
  open,
  onNavigate,
}: {
  open: string | null;
  onNavigate: () => void;
}) {
  const reduced = useReducedMotion() ?? false;
  // Keep the last open section rendered through the exit fade so the panel
  // doesn't blank out mid-close.
  const lastOpen = useRef<string | null>(open);
  if (open) lastOpen.current = open;
  const activeHref = open ?? lastOpen.current;
  const activeIndex = Math.max(
    0,
    MEGA_MENU_SECTIONS.findIndex((section) => section.href === activeHref),
  );

  return (
    <div
      inert={!open}
      className={cn(
        "absolute left-1/2 top-full z-50 -translate-x-1/2 pt-3 max-lg:hidden",
        open
          ? "visible"
          : "invisible pointer-events-none [transition:visibility_0s_linear_150ms]",
      )}
    >
      <motion.div
        id="site-mega-menu"
        initial={false}
        animate={open ? "open" : "closed"}
        variants={{
          open: {
            opacity: 1,
            scale: 1,
            y: 0,
            transition: reduced ? { duration: 0 } : OPEN_SPRING,
          },
          closed: {
            opacity: 0,
            scale: 0.97,
            y: -6,
            transition: reduced
              ? { duration: 0 }
              : { duration: 0.13, ease: "easeIn" },
          },
        }}
        className="origin-top rounded-[20px] bg-popover p-3 text-popover-foreground shadow-lg ring-1 ring-foreground/5 dark:ring-foreground/10"
      >
        <motion.div
          initial={false}
          animate={{
            width: MEGA_MENU_SECTIONS[activeIndex].listWidth + 20 + 384,
          }}
          transition={reduced ? { duration: 0 } : SLIDE_SPRING}
          className="relative h-[216px]"
        >
          {MEGA_MENU_SECTIONS.map((section, index) => (
            <Section
              key={section.href}
              section={section}
              offset={index - activeIndex}
              menuOpen={open === section.href}
              onNavigate={onNavigate}
              reduced={reduced}
            />
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}

function Section({
  section,
  offset,
  menuOpen,
  onNavigate,
  reduced,
}: {
  section: MegaMenuSection;
  offset: number;
  menuOpen: boolean;
  onNavigate: () => void;
  reduced: boolean;
}) {
  const active = offset === 0;
  const [hoveredIndex, setHoveredIndex] = useState(0);
  const item = section.items[hoveredIndex] ?? section.items[0];
  const previewItem = useDebouncedValue(item, 90);

  return (
    <motion.div
      inert={!active || !menuOpen}
      initial={false}
      animate={{
        x: reduced || active ? 0 : offset < 0 ? -28 : 28,
        opacity: active ? 1 : 0,
      }}
      transition={reduced ? { duration: 0 } : SLIDE_SPRING}
      className={cn(
        "absolute left-0 top-0 flex h-full gap-5",
        active
          ? "visible"
          : "invisible [transition:visibility_0s_linear_200ms]",
      )}
    >
      <div
        style={{ width: section.listWidth }}
        className="grid shrink-0 auto-cols-fr grid-flow-col grid-rows-6 gap-x-2 gap-y-1"
      >
        {section.items.map((menuItem, index) => (
          <MenuRow
            key={`${menuItem.preview}-${index}`}
            item={menuItem}
            hovered={index === hoveredIndex}
            onHover={() => setHoveredIndex(index)}
            onNavigate={onNavigate}
          />
        ))}
      </div>
      <div className="w-96 shrink-0">
        <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted/40">
          <AnimatePresence initial={false}>
            {active && menuOpen && (
              <motion.div
                key={previewItem.preview}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduced ? 0 : 0.15 }}
                className="absolute inset-0"
              >
                <MegaMenuPreview name={previewItem.preview} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

function MenuRow({
  item,
  hovered,
  onHover,
  onNavigate,
}: {
  item: MegaMenuItem;
  hovered: boolean;
  onHover: () => void;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      onMouseEnter={onHover}
      onFocus={onHover}
      className={cn(
        "flex min-w-0 items-center rounded-lg px-3 text-sm font-medium transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
        hovered ? "bg-muted text-foreground" : "text-muted-foreground",
      )}
    >
      <span className="truncate">{item.label}</span>
    </Link>
  );
}
