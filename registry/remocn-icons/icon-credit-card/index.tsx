"use client";

import { Easing, interpolate } from "remotion";
import {
  drawnPathProps,
  type IconAnimationProps,
  useIconAnimation,
} from "@/lib/remocn-icons";

const CARD_PATH =
  "M4 5H20A2 2 0 0 1 22 7V17A2 2 0 0 1 20 19H4A2 2 0 0 1 2 17V7A2 2 0 0 1 4 5Z";
const STRIPE_PATH = "M2 10H22";

const PIVOT_X = 12;
const PIVOT_Y = 19;

const TIMINGS = {
  drawDurationInFrames: 14,
  actionDelayInFrames: 2,
  actionDurationInFrames: 24,
  loop: false,
} as const;

export function CreditCardIcon({
  animation = "both",
  loop,
  speed,
  size = 48,
  color = "currentColor",
  strokeWidth = 2,
  className,
}: IconAnimationProps) {
  const { drawProgress, scaleIn, actionProgress, actionFrame } =
    useIconAnimation({ animation, loop, speed }, TIMINGS);

  const acting = animation !== "draw" && actionFrame >= 0;

  const swipe = interpolate(actionProgress, [0.1, 0.45], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const tilt = acting
    ? interpolate(actionProgress, [0.4, 0.6, 1], [0, 4, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.inOut(Easing.quad),
      })
    : 0;

  const stripeProgress = animation === "draw" ? 1 : acting ? swipe : 0;

  const card = drawnPathProps(CARD_PATH, drawProgress);
  const stripe = drawnPathProps(STRIPE_PATH, stripeProgress);

  const scale = 0.85 + 0.15 * scaleIn;

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        overflow: "visible",
        transformOrigin: "center",
        transform: `scale(${scale})`,
      }}
    >
      <g transform={`rotate(${tilt} ${PIVOT_X} ${PIVOT_Y})`}>
        <path
          d={CARD_PATH}
          strokeDasharray={card.strokeDasharray}
          strokeDashoffset={card.strokeDashoffset}
        />
        <path
          d={STRIPE_PATH}
          strokeDasharray={stripe.strokeDasharray}
          strokeDashoffset={stripe.strokeDashoffset}
        />
      </g>
    </svg>
  );
}

export function CreditCardIconStatic({
  size = 48,
  color = "currentColor",
  strokeWidth = 2,
  className,
}: {
  size?: number;
  color?: string;
  strokeWidth?: number;
  className?: string;
}) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="14" x="2" y="5" rx="2" />
      <line x1="2" x2="22" y1="10" y2="10" />
    </svg>
  );
}
