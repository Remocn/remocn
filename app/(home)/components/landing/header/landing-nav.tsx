"use client";

import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { DOCS_MENU_HREF } from "@/config/docs-directory";
import { type NavLink, STUDIO_URL } from "@/config/site";
import { cn } from "@/lib/utils";
import { NavBadge } from "../../header-nav";
import { StudioAppIcon } from "../ui/remocn-mark";

const OPEN_DELAY = 60;
const CLOSE_DELAY = 140;

const canOpenMenu = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(min-width: 64rem) and (hover: hover)").matches;

type MenuState = {
  open: string | null;
  scheduleOpen: (href: string) => void;
  scheduleClose: (delay?: number) => void;
  cancelClose: () => void;
  openNow: (href: string) => void;
  closeNow: () => void;
};

const MenuContext = createContext<MenuState | null>(null);

function useMenu() {
  const value = useContext(MenuContext);
  if (!value)
    throw new Error("Landing nav parts must render inside LandingMenu");
  return value;
}

export function LandingMenu({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pathname = usePathname();

  const clearTimers = useCallback(() => {
    if (openTimer.current) clearTimeout(openTimer.current);
    if (closeTimer.current) clearTimeout(closeTimer.current);
    openTimer.current = null;
    closeTimer.current = null;
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  useEffect(() => {
    if (pathname) setOpen(null);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      clearTimers();
      setOpen(null);
      // The panel turns inert as it closes, which would drop focus to <body>.
      if (document.activeElement?.closest("#landing-docs-menu")) {
        document
          .querySelector<HTMLElement>('[aria-controls="landing-docs-menu"]')
          ?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, clearTimers]);

  const value = useMemo<MenuState>(
    () => ({
      open,
      scheduleOpen: (href) => {
        if (!canOpenMenu()) return;
        clearTimers();
        if (open) setOpen(href);
        else openTimer.current = setTimeout(() => setOpen(href), OPEN_DELAY);
      },
      scheduleClose: (delay = CLOSE_DELAY) => {
        clearTimers();
        closeTimer.current = setTimeout(() => setOpen(null), delay);
      },
      cancelClose: () => {
        if (closeTimer.current) clearTimeout(closeTimer.current);
        closeTimer.current = null;
      },
      openNow: (href) => {
        clearTimers();
        setOpen(href);
      },
      closeNow: () => {
        clearTimers();
        setOpen(null);
      },
    }),
    [open, clearTimers],
  );

  return (
    <MenuContext.Provider value={value}>
      <div className={className}>{children}</div>
    </MenuContext.Provider>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={cn(
        "size-3.5 shrink-0 transition-transform duration-200 ease-out",
        open && "rotate-180",
      )}
    >
      <path
        d="m6 9 6 6 6-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const POP_SPRING = {
  type: "spring",
  stiffness: 420,
  damping: 20,
  mass: 0.8,
  restDelta: 0.5,
  restSpeed: 4,
} as const;

const STUDIO_GROW = 28;

const TUCK = { duration: 0.2, ease: [0.25, 1, 0.5, 1] } as const;

function StudioPop({ shown }: { shown: boolean }) {
  const reduced = useReducedMotion() ?? false;
  const transition = reduced ? { duration: 0 } : shown ? POP_SPRING : TUCK;
  return (
    <motion.span
      aria-hidden="true"
      initial={false}
      data-pill-pop
      animate={{ width: shown ? STUDIO_GROW : 0 }}
      transition={transition}
      className="relative z-0 -mr-1.5 flex h-[22px] shrink-0 items-center"
    >
      <motion.span
        initial={false}
        // Transform strings (not x/scale/rotate) so the browser can run the
        // spring off the main thread.
        animate={
          shown
            ? {
                transform: "translateX(0px) scale(1) rotate(0deg)",
                opacity: 1,
              }
            : {
                transform: "translateX(18px) scale(0.4) rotate(-18deg)",
                opacity: 0,
              }
        }
        transition={transition}
        className="flex"
      >
        <StudioAppIcon size={22} radius={6} markSize={9} />
      </motion.span>
    </motion.span>
  );
}

function YieldingBadge({
  hidden,
  children,
}: {
  hidden: boolean;
  children: string;
}) {
  const reduced = useReducedMotion() ?? false;
  const transition = reduced ? { duration: 0 } : hidden ? TUCK : POP_SPRING;
  return (
    <motion.span
      data-pill-yield
      initial={false}
      animate={
        hidden
          ? { width: 0, marginLeft: -6, opacity: 0, scale: 0.8 }
          : { width: "auto", marginLeft: 0, opacity: 1, scale: 1 }
      }
      transition={transition}
      className="flex shrink-0 justify-end overflow-hidden"
    >
      <NavBadge className="shrink-0">{children}</NavBadge>
    </motion.span>
  );
}

const ITEM =
  "relative flex h-(--hdr-item-h) items-center gap-1.5 rounded-(--hdr-item-r) px-(--hdr-pad) text-ui outline-none transition-[color,background-color,box-shadow] duration-150 focus-visible:ring-2 focus-visible:ring-primary";
const RAISED =
  "bg-surface font-medium text-foreground shadow-[0_0_0_1px_#0E10120D,0_1px_3px_#0E10121A] dark:shadow-[0_0_0_1px_#FFFFFF12]";

export function LandingNav({
  links,
  className,
}: {
  links: NavLink[];
  className?: string;
}) {
  const menu = useMenu();
  const pathname = usePathname();
  const [studioHot, setStudioHot] = useState(false);
  const studioRef = useRef<HTMLAnchorElement>(null);
  const [studioWidth, setStudioWidth] = useState<number>();

  useEffect(() => {
    const item = studioRef.current;
    if (!item) return;
    const measure = () => {
      if (item.querySelector("[data-pill-pop]")?.getBoundingClientRect().width)
        return;
      const badge = item.querySelector("[data-pill-yield]");
      const freed = badge ? badge.getBoundingClientRect().width + 6 : 0;
      setStudioWidth(item.getBoundingClientRect().width + STUDIO_GROW - freed);
    };
    measure();
    document.fonts?.ready.then(measure);
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  return (
    <nav
      aria-label="Main"
      onMouseEnter={menu.cancelClose}
      onMouseLeave={() => menu.scheduleClose()}
      className={cn("relative flex items-center", className)}
    >
      {links.map((link) => {
        const hasMenu = link.href === DOCS_MENU_HREF;
        const isOpen = hasMenu && menu.open === link.href;
        const prefix = link.current === undefined ? link.href : link.current;
        const current =
          !link.external &&
          prefix !== null &&
          pathname !== "/" &&
          pathname.startsWith(prefix);
        const faded = menu.open !== null && !isOpen;
        const isStudio = link.href === STUDIO_URL;
        const isSponsors = link.href === "/sponsors";
        return (
          <Link
            key={link.href}
            href={link.href}
            data-pill="nav"
            ref={isStudio ? studioRef : undefined}
            data-pill-width={isStudio ? studioWidth : undefined}
            data-pill-sweep={isStudio ? "" : undefined}
            data-pill-metal={isSponsors ? "" : undefined}
            onMouseEnter={() => {
              if (isStudio) setStudioHot(true);
              if (hasMenu) menu.scheduleOpen(link.href);
              else menu.scheduleClose(100);
            }}
            onMouseLeave={isStudio ? () => setStudioHot(false) : undefined}
            onFocus={
              isStudio
                ? (event) =>
                    setStudioHot(event.currentTarget.matches(":focus-visible"))
                : undefined
            }
            onBlur={isStudio ? () => setStudioHot(false) : undefined}
            onKeyDown={(event) => {
              if (!hasMenu) return;
              if (event.key === "ArrowDown" || event.key === " ") {
                event.preventDefault();
                menu.openNow(link.href);
                requestAnimationFrame(() =>
                  document
                    .querySelector<HTMLElement>(
                      "#landing-docs-menu [data-menu-link]",
                    )
                    ?.focus(),
                );
              }
            }}
            onClick={menu.closeNow}
            aria-haspopup={hasMenu ? "true" : undefined}
            aria-expanded={hasMenu ? isOpen : undefined}
            aria-controls={hasMenu ? "landing-docs-menu" : undefined}
            aria-current={current ? "page" : undefined}
            target={link.external ? "_blank" : undefined}
            rel={link.external ? "noreferrer" : undefined}
            className={cn(
              ITEM,
              current
                ? RAISED
                : isOpen
                  ? "text-foreground"
                  : faded
                    ? "text-muted-foreground"
                    : "text-foreground-nav",
              hasMenu && "pr-3",
            )}
          >
            {isStudio && <StudioPop shown={studioHot} />}
            <span className="relative z-10">{link.label}</span>
            {hasMenu && <Chevron open={isOpen} />}
            {link.badge &&
              (isStudio ? (
                <YieldingBadge hidden={studioHot}>{link.badge}</YieldingBadge>
              ) : (
                <NavBadge>{link.badge}</NavBadge>
              ))}
          </Link>
        );
      })}
    </nav>
  );
}

export function LandingMenuPanel({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  const menu = useMenu();
  const reduced = useReducedMotion() ?? false;
  const open = menu.open === href;

  return (
    <nav
      aria-label="Docs"
      inert={!open}
      onMouseEnter={menu.cancelClose}
      onMouseLeave={() => menu.scheduleClose()}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          menu.scheduleClose(0);
        }
      }}
      className={cn(
        "absolute inset-x-4 top-full z-50 pt-2.5 max-lg:hidden md:inset-x-10 xl:inset-x-0",
        open
          ? "visible"
          : "pointer-events-none invisible [transition:visibility_0s_linear_160ms]",
      )}
    >
      <motion.div
        id="landing-docs-menu"
        initial={false}
        animate={open ? "open" : "closed"}
        variants={{
          // Transform strings so the open/close runs off the main thread.
          open: {
            opacity: 1,
            transform: "translateY(0px) scale(1)",
            transition: reduced
              ? { duration: 0 }
              : { type: "spring", stiffness: 520, damping: 40, mass: 0.7 },
          },
          closed: {
            opacity: 0,
            transform: "translateY(-6px) scale(0.985)",
            transition: reduced
              ? { duration: 0 }
              : { duration: 0.14, ease: [0.23, 1, 0.32, 1] },
          },
        }}
        className="origin-top rounded-panel bg-surface p-3 shadow-[0_0_0_1px_#0E10120F,0_24px_60px_#0E10121F] dark:shadow-[0_0_0_1px_#FFFFFF12,0_24px_60px_#00000080]"
      >
        {children}
      </motion.div>
    </nav>
  );
}
