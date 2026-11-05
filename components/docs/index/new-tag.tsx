import type { ReactNode } from "react";

/** Small fuchsia "New" / "6 new" tag next to a title. */
export function NewTag({ children }: { children: ReactNode }) {
  return (
    <span className="shrink-0 rounded-tag bg-primary-tint px-1.5 py-0.5 text-micro leading-[14px] font-medium text-primary-strong dark:text-primary-soft">
      {children}
    </span>
  );
}
