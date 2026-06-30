"use client";

import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  FLOW_BG,
  FLOW_BORDER,
  FLOW_GREEN_MID,
  FLOW_GREEN_TOP,
  FLOW_INK,
  FLOW_MUTED,
  FLOW_YELLOW,
  FONT,
  FONT_SERIF,
} from "../foundation";

type Testimonial = {
  name: string;
  role: string;
  quote: string;
};

const TESTIMONIALS: Testimonial[] = [
  {
    name: "Lena R.",
    role: "Product Owner",
    quote:
      "I didn't realize how much mental energy I was wasting on organizing until I stopped doing it. Flowith just handles it.",
  },
  {
    name: "Tomas H.",
    role: "Design Agency Owner",
    quote:
      "Client projects, internal tasks, team docs - all connected. Our delivery time dropped by 20% in the first month.",
  },
  {
    name: "Priya S.",
    role: "Head of Marketing",
    quote:
      "It's the first tool that actually adapts to how I work instead of forcing me into a rigid structure.",
  },
];

function CornerTriangle({ corner }: { corner: "top" | "bottom" }) {
  const isTop = corner === "top";
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: isTop ? 0 : undefined,
        bottom: isTop ? undefined : 0,
        width: 0,
        height: 0,
        borderLeft: `120px solid ${FLOW_YELLOW}`,
        borderTop: isTop ? "120px solid transparent" : undefined,
        borderBottom: isTop ? undefined : "120px solid transparent",
      }}
    />
  );
}

function TestimonialCard({
  item,
  index,
  f,
  fps,
}: {
  item: Testimonial;
  index: number;
  f: number;
  fps: number;
}) {
  const enter = spring({
    frame: f - 28 - index * 9,
    fps,
    config: { damping: 18, stiffness: 110 },
  });
  const ty = interpolate(enter, [0, 1], [60, 0]);
  const opacity = interpolate(enter, [0, 1], [0, 1]);

  return (
    <div
      style={{
        width: 400,
        background: "#FFFFFF",
        border: `1px solid ${FLOW_BORDER}`,
        borderRadius: 14,
        boxShadow: "0 18px 44px rgba(30, 28, 22, 0.08)",
        padding: 32,
        display: "flex",
        flexDirection: "column",
        gap: 20,
        opacity,
        transform: `translateY(${ty}px)`,
        willChange: "transform, opacity",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            background: `linear-gradient(150deg, ${FLOW_GREEN_TOP}, ${FLOW_GREEN_MID})`,
            flexShrink: 0,
          }}
        />
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span
            style={{
              fontFamily: FONT,
              fontSize: 22,
              fontWeight: 700,
              color: FLOW_INK,
            }}
          >
            {item.name}
          </span>
          <span
            style={{ fontFamily: FONT, fontSize: 17, color: FLOW_MUTED }}
          >
            {item.role}
          </span>
        </div>
      </div>
      <p
        style={{
          margin: 0,
          fontFamily: FONT,
          fontSize: 20,
          lineHeight: 1.5,
          color: FLOW_INK,
        }}
      >
        {item.quote}
      </p>
    </div>
  );
}

export function SocialProof({ speed = 1 }: { speed?: number }) {
  const f = useCurrentFrame() * speed;
  const { fps } = useVideoConfig();

  const headEnter = spring({
    frame: f,
    fps,
    config: { damping: 20, stiffness: 110 },
  });
  const headTy = interpolate(headEnter, [0, 1], [40, 0]);
  const headOpacity = interpolate(headEnter, [0, 1], [0, 1]);

  const subOpacity = interpolate(f, [14, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const barProgress = interpolate(f, [54, 110], [0.12, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: FLOW_BG,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <CornerTriangle corner="top" />
      <CornerTriangle corner="bottom" />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 56,
          width: "100%",
          maxWidth: 1400,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            opacity: headOpacity,
            transform: `translateY(${headTy}px)`,
            willChange: "transform, opacity",
          }}
        >
          <span
            style={{
              fontFamily: FONT_SERIF,
              fontSize: 80,
              fontWeight: 700,
              color: FLOW_YELLOW,
              lineHeight: 0.7,
              marginBottom: 8,
            }}
          >
            &ldquo;
          </span>
          <h2
            style={{
              margin: 0,
              fontFamily: FONT_SERIF,
              fontSize: 58,
              fontWeight: 600,
              color: FLOW_INK,
              textAlign: "center",
              lineHeight: 1.15,
            }}
          >
            Join 12,000+ people who found their flow
          </h2>
          <p
            style={{
              margin: "20px 0 0",
              fontFamily: FONT,
              fontSize: 24,
              color: FLOW_MUTED,
              textAlign: "center",
              opacity: subOpacity,
              maxWidth: 760,
            }}
          >
            Freelancers, agencies, and growing teams switched to Flowith and
            never looked back.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "row", gap: 40 }}>
          {TESTIMONIALS.map((item, i) => (
            <TestimonialCard
              key={item.name}
              item={item}
              index={i}
              f={f}
              fps={fps}
            />
          ))}
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 24,
            width: 1240,
          }}
        >
          <div
            style={{
              width: "100%",
              height: 5,
              borderRadius: 999,
              background: FLOW_BORDER,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${barProgress * 100}%`,
                height: "100%",
                borderRadius: 999,
                background: `linear-gradient(90deg, ${FLOW_GREEN_TOP}, ${FLOW_GREEN_MID})`,
              }}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "row", gap: 12 }}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: i === 0 ? FLOW_GREEN_MID : FLOW_BORDER,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}
