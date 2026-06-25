"use client";
import { type CSSProperties, type HTMLAttributes, type ReactNode, useRef } from "react";
import { cn } from "@/lib/utils";

export function SpotlightSurface({
  className,
  style,
  children,
  ...rest
}: {
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
} & HTMLAttributes<HTMLDivElement>) {
  const ref = useRef<HTMLDivElement>(null);
  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  };
  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: spotlight cursor tracking is purely visual
    <div
      ref={ref}
      onMouseMove={handleMove}
      className={cn(className)}
      style={{ "--mx": "50%", "--my": "50%", ...style } as CSSProperties}
      {...rest}
    >
      {children}
    </div>
  );
}
