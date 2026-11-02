"use client";

import { Menu } from "@base-ui/react/menu";
import type { ReactNode } from "react";
import { ArrowUpRightIcon } from "./shell/docs-icons";

const ITEM =
  "flex h-9 items-center gap-2.5 rounded-[10px] px-2.5 text-small text-foreground outline-none select-none data-highlighted:bg-surface-muted";

/** The dropdown both agent menus share: "Copy page" and "Open in". */
export function AgentMenuPopup({ children }: { children: ReactNode }) {
  return (
    <Menu.Portal>
      <Menu.Positioner
        side="bottom"
        align="end"
        sideOffset={8}
        className="z-50"
      >
        <Menu.Popup className="flex min-w-[220px] origin-(--transform-origin) flex-col gap-0.5 rounded-cta bg-surface p-1.5 shadow-[0_0_0_1px_var(--color-hairline),0_16px_40px_-16px_#0E101240] outline-none transition-[opacity,scale] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-ending-style:duration-100 data-starting-style:scale-[0.98] data-starting-style:opacity-0 motion-reduce:data-ending-style:scale-100 motion-reduce:data-starting-style:scale-100 dark:shadow-[0_0_0_1px_var(--color-hairline),0_16px_40px_-16px_#00000080]">
          {children}
        </Menu.Popup>
      </Menu.Positioner>
    </Menu.Portal>
  );
}

function ItemIcon({ children }: { children: ReactNode }) {
  return (
    <span className="flex size-4 shrink-0 items-center justify-center">
      {children}
    </span>
  );
}

/** An external hand-off: icon, label and the outbound arrow. */
export function AgentMenuLink({
  href,
  icon,
  onClick,
  children,
}: {
  href: string;
  icon: ReactNode;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <Menu.LinkItem
      href={href}
      target="_blank"
      rel="noreferrer"
      onClick={onClick}
      className={ITEM}
    >
      <ItemIcon>{icon}</ItemIcon>
      <span className="flex-1">{children}</span>
      <ArrowUpRightIcon className="size-3 shrink-0 text-subtle" />
    </Menu.LinkItem>
  );
}

/** An in-page action (copy), styled like the links. */
export function AgentMenuAction({
  icon,
  onClick,
  closeOnClick = true,
  children,
}: {
  icon: ReactNode;
  onClick: () => void;
  closeOnClick?: boolean;
  children: ReactNode;
}) {
  return (
    <Menu.Item onClick={onClick} closeOnClick={closeOnClick} className={ITEM}>
      <ItemIcon>{icon}</ItemIcon>
      <span className="flex-1">{children}</span>
    </Menu.Item>
  );
}

export function AgentMenuSeparator() {
  return <Menu.Separator className="mx-2.5 my-1 h-px bg-hairline" />;
}
