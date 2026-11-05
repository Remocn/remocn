import type { CSSProperties } from "react";

export type CompareCardProps = {
  label: string;
  /** Headline split into the lines it breaks into on mobile; one line on desktop. */
  value: string[];
  caption: string;
  tone: "muted" | "shader";
};

const SHADER_BACKGROUND: CSSProperties = {
  backgroundImage:
    "linear-gradient(180deg in oklab, #07050700 0%, #07050700 35%, #070507e6 75%), url(/landing/shader-why.png)",
  backgroundPosition: "50%, 50% 30%",
  backgroundSize: "cover",
};

const TONE = {
  muted: {
    card: "bg-tile",
    label: "text-muted-foreground",
    value: "text-title-muted",
    caption: "text-body-muted",
  },
  shader: {
    card: "bg-[#070507]",
    label: "text-primary-soft",
    value: "text-white",
    caption: "text-[#d4d8da]",
  },
} as const;

/** One side of the "motion designer vs remocn" comparison. */
export function CompareCard({ label, value, caption, tone }: CompareCardProps) {
  const styles = TONE[tone];
  return (
    <div
      className={`relative isolate flex h-[220px] min-w-0 flex-col justify-between overflow-clip rounded-panel p-6 lg:h-[300px] lg:flex-1 lg:basis-0 lg:rounded-shell lg:px-10 lg:py-9 ${styles.card}`}
    >
      {tone === "shader" && (
        <span
          aria-hidden="true"
          className="bg-settle absolute inset-0 -z-10"
          style={SHADER_BACKGROUND}
        />
      )}
      <p className={`text-[13px] leading-4 lg:text-[12px] ${styles.label}`}>
        {label}
      </p>
      <div className="flex flex-col gap-2 lg:gap-2.5">
        <p
          className={`relative w-fit text-[40px] leading-[42px] tracking-[-0.055em] xl:text-[56px] xl:leading-[58px] xl:whitespace-nowrap ${styles.value}`}
        >
          {value.map((line, index) => (
            <span key={line} className="block xl:inline">
              {index > 0 && " "}
              {line}
            </span>
          ))}
          {tone === "muted" && (
            <span
              aria-hidden="true"
              className="seq-draw absolute inset-x-[-2%] top-[54%] h-[3px] origin-left rounded-full bg-current [--at:800ms] [--dur:900ms]"
            />
          )}
        </p>
        <p
          className={`text-[16px] leading-[22px] lg:text-[17px] ${styles.caption}`}
        >
          {caption}
        </p>
      </div>
    </div>
  );
}
