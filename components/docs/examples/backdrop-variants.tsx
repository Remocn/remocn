"use client";

import { Backdrop } from "@/registry/remocn/backdrop";
import { ShaderGrainGradient } from "@/registry/remocn/shader-grain-gradient";

function DemoContent() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0f0f12",
        color: "#e5e5e5",
        fontFamily: "system-ui, sans-serif",
        fontSize: 48,
        fontWeight: 600,
      }}
    >
      Your content
    </div>
  );
}

function TransparentDemoContent() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "transparent",
        color: "#fff",
        fontFamily: "system-ui, sans-serif",
        fontSize: 48,
        fontWeight: 600,
      }}
    >
      Your content
    </div>
  );
}

export const BackdropColorScene = () => (
  <Backdrop fill={{ type: "color", value: "#6366f1" }} shadow="0" padding={0}>
    <TransparentDemoContent />
  </Backdrop>
);

export const BackdropGradientScene = () => (
  <Backdrop
    fill={{
      type: "gradient",
      value: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
    }}
  >
    <DemoContent />
  </Backdrop>
);

export const BackdropImageScene = () => (
  <Backdrop fill={{ type: "image", src: "https://picsum.photos/1280/720" }}>
    <DemoContent />
  </Backdrop>
);

export const BackdropLiveScene = () => (
  <Backdrop fill={<ShaderGrainGradient />} shadow="0" padding={0}>
    <TransparentDemoContent />
  </Backdrop>
);

export const backdropColorCode = `import { Backdrop } from "@/components/remocn/backdrop";

<Backdrop fill={{ type: "color", value: "#0a0a0a" }} shadow="0" padding={0}>
  <YourScene />
</Backdrop>`;

export const backdropGradientCode = `import { Backdrop } from "@/components/remocn/backdrop";

<Backdrop fill={{ type: "gradient", value: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)" }}>
  <YourScene />
</Backdrop>`;

export const backdropImageCode = `import { Backdrop } from "@/components/remocn/backdrop";

<Backdrop fill={{ type: "image", src: "/bg.jpg" }}>
  <YourScene />
</Backdrop>`;

export const backdropLiveCode = `import { Backdrop } from "@/components/remocn/backdrop";
import { ShaderGrainGradient } from "@/components/remocn/shader-grain-gradient";

<Backdrop fill={<ShaderGrainGradient />} shadow="0" padding={0}>
  <YourScene />
</Backdrop>`;
