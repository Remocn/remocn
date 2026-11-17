"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";

export interface AgentCursorHandle {
  /** Flies to a viewport point over `duration` ms, or hides with null. */
  moveTo: (point: { x: number; y: number } | null, duration: number) => void;
  /** Puts the cursor back on top after a popup opened above it. */
  raise: () => void;
}

function isShown(node: HTMLElement): boolean {
  try {
    return node.matches(":popover-open");
  } catch {
    return false;
  }
}

/**
 * The pointer that shows the agent working through the panel. ui-sdk popups
 * open in the browser's top layer, which no z-index reaches, so the cursor
 * is a manual popover too and is shown again after each popup opens.
 */
export const AgentCursor = forwardRef<AgentCursorHandle>(
  function AgentCursor(_, ref) {
    const element = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => {
      const show = () => {
        const node = element.current;
        if (!node?.showPopover) return;
        if (isShown(node)) node.hidePopover();
        node.showPopover();
      };
      return {
        moveTo: (point, duration) => {
          const node = element.current;
          if (!node) return;
          if (!point) {
            node.style.opacity = "0";
            return;
          }
          if (!isShown(node)) show();
          node.style.transitionDuration = `${duration}ms, 200ms`;
          node.style.transform = `translate3d(${point.x}px, ${point.y}px, 0)`;
          node.style.opacity = "1";
        },
        raise: show,
      };
    }, []);

    return (
      <div
        ref={element}
        popover="manual"
        aria-hidden="true"
        className="pointer-events-none fixed inset-auto top-0 left-0 m-0 overflow-visible border-0 bg-transparent p-0 opacity-0 motion-reduce:hidden"
        style={{
          transitionProperty: "transform, opacity",
          transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
        }}
        onTransitionEnd={(event) => {
          const node = event.currentTarget;
          if (event.propertyName === "opacity" && node.style.opacity === "0") {
            if (isShown(node)) node.hidePopover?.();
          }
        }}
      >
        <svg
          viewBox="0 0 16 16"
          className="size-4 drop-shadow-[0_1px_2px_#0009]"
          aria-hidden="true"
        >
          <path
            d="M2 1.5 13.5 7 8.2 8.4 5.8 13.5Z"
            fill="#fafafa"
            stroke="#0b0b0b"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
        </svg>
        <span className="ml-3 -mt-0.5 inline-block rounded-full bg-[#a21caf] px-2 py-0.5 text-[11px] leading-4 font-medium whitespace-nowrap text-white shadow-[0_1px_2px_#0006]">
          Agent
        </span>
      </div>
    );
  },
);
