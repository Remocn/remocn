import type { SVGProps } from "react";

const NextjsIconDark = (props: SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 180 180">
    <mask
      height="180"
      id=":r8:mask0_408_134"
      maskUnits="userSpaceOnUse"
      width="180"
      x="0"
      y="0"
      style={{ maskType: "alpha" }}
    >
      <circle cx="90" cy="90" fill="black" r="90" />
    </mask>
    <g mask="url(#:r8:mask0_408_134)">
      <circle cx="90" cy="90" data-circle="true" fill="currentColor" r="90" />
      <path
        d="M149.508 157.52L69.142 54H54V125.97H66.1136V69.3836L139.999 164.845C143.333 162.614 146.509 160.165 149.508 157.52Z"
        fill="url(#:r8:paint0_linear_408_134)"
      />
      <rect
        fill="url(#:r8:paint1_linear_408_134)"
        height="72"
        width="12"
        x="115"
        y="54"
      />
    </g>
    <defs>
      <linearGradient
        gradientUnits="userSpaceOnUse"
        id=":r8:paint0_linear_408_134"
        x1="109"
        x2="144.5"
        y1="116.5"
        y2="160.5"
      >
        <stop style={{ stopColor: "var(--background)" }} />
        <stop
          offset="1"
          style={{ stopColor: "var(--background)", stopOpacity: 0 }}
        />
      </linearGradient>
      <linearGradient
        gradientUnits="userSpaceOnUse"
        id=":r8:paint1_linear_408_134"
        x1="121"
        x2="120.799"
        y1="54"
        y2="106.875"
      >
        <stop style={{ stopColor: "var(--background)" }} />
        <stop
          offset="1"
          style={{ stopColor: "var(--background)", stopOpacity: 0 }}
        />
      </linearGradient>
    </defs>
  </svg>
);

export { NextjsIconDark };
