"use client";

import { motion } from "motion/react";
import { EASE_IN_OUT, EASE_OUT, Frame, Letters, Words } from "./kit";
import type { SceneDef, SceneProps, SceneSet } from "./types";

const VIOLET = "/landing/shader-violet.png";
const MAGENTA = "/landing/shader-magenta.png";

const big = "font-semibold tracking-[-0.05em] leading-[0.9]";

function def(
  block: string,
  surface: string,
  dark: boolean,
  duration: number,
  render: SceneDef["render"],
): SceneDef {
  return { block, surface, dark, duration, render };
}

function ShaderType({
  cycle,
  speed,
  image,
  text,
}: SceneProps & { image: string; text: string }) {
  return (
    <Frame
      className="bg-cover"
      style={{ backgroundImage: `url(${image})`, backgroundPosition: "40%" }}
    >
      <motion.div
        className="absolute inset-0 bg-cover"
        style={{ backgroundImage: `url(${image})` }}
        animate={{ scale: [1, 1.12] }}
        transition={{
          duration: 6,
          ease: "linear",
          repeat: Infinity,
          repeatType: "mirror",
        }}
      />
      <div className="absolute inset-x-5 bottom-4 text-[46px] text-white">
        <Letters
          text={text}
          cycle={cycle}
          speed={speed}
          className={big}
          initial={{ y: "60%", opacity: 0, filter: "blur(8px)" }}
          animate={{ y: "0%", opacity: 1, filter: "blur(0px)" }}
          stagger={0.035}
        />
      </div>
    </Frame>
  );
}

function Bauhaus({ cycle, speed }: SceneProps) {
  const d = (s: number) => s / speed;
  return (
    <Frame className="bg-[#0E1012]">
      <div key={cycle} className="absolute inset-0">
        <motion.span
          className="absolute top-6 left-6 size-[96px] rounded-full bg-[#A800B7]"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            type: "spring",
            visualDuration: d(0.5),
            bounce: 0.35,
            delay: d(0.1),
          }}
        />
        <motion.span
          className="absolute right-6 bottom-6 h-[64px] w-[128px] rounded-t-full bg-[#F4F4F5]"
          initial={{ rotate: -180, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          transition={{ duration: d(0.7), ease: EASE_OUT, delay: d(0.35) }}
          style={{ transformOrigin: "50% 100%" }}
        />
        <motion.span
          className="absolute top-[70px] right-[52px] size-[44px] bg-[#F0ABFC]"
          initial={{ scale: 0, rotate: 45 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            type: "spring",
            visualDuration: d(0.45),
            bounce: 0.3,
            delay: d(0.6),
          }}
        />
      </div>
    </Frame>
  );
}

function SpeedLines({ cycle, speed, word }: SceneProps & { word: string }) {
  const lines = [18, 38, 58, 78, 98, 118];
  return (
    <Frame className="bg-[#0E1012]">
      {lines.map((top, i) => (
        <motion.span
          key={top}
          className="absolute h-[2px] rounded-full bg-white/30"
          style={{ top, width: 60 + (i % 3) * 40 }}
          animate={{ x: [-160, 280] }}
          transition={{
            duration: (0.55 + (i % 3) * 0.15) / speed,
            repeat: Infinity,
            ease: "linear",
            delay: i * 0.08,
          }}
        />
      ))}
      <motion.span
        key={cycle}
        className={`absolute bottom-6 left-[18px] text-[54px] text-white italic ${big}`}
        initial={{ x: -260, skewX: -20, filter: "blur(6px)" }}
        animate={{ x: 0, skewX: 0, filter: "blur(0px)" }}
        transition={{
          duration: 0.6 / speed,
          ease: EASE_OUT,
          delay: 0.1 / speed,
        }}
      >
        {word}
      </motion.span>
    </Frame>
  );
}

function MaskLines({
  cycle,
  speed,
  lines,
  className,
}: SceneProps & { lines: string[]; className: string }) {
  return (
    <Frame className={className}>
      <div
        key={cycle}
        className="absolute inset-x-[18px] bottom-4 flex flex-col"
      >
        {lines.map((line, i) => (
          <span key={line} className="overflow-hidden">
            <motion.span
              className={`block text-[40px] ${big}`}
              initial={{ y: "105%" }}
              animate={{ y: "0%" }}
              transition={{
                duration: 0.6 / speed,
                ease: EASE_IN_OUT,
                delay: (0.15 + i * 0.14) / speed,
              }}
            >
              {line}
            </motion.span>
          </span>
        ))}
      </div>
    </Frame>
  );
}

function TrimBurst({ cycle, speed, word }: SceneProps & { word: string }) {
  const rays = Array.from({ length: 12 }, (_, i) => i * 30);
  return (
    <Frame className="bg-[#0E1012]">
      <div
        key={cycle}
        className="absolute inset-0 flex items-center justify-center"
      >
        {rays.map((angle) => (
          <motion.span
            key={angle}
            className="absolute h-[3px] w-[70px] origin-left rounded-full bg-[#F0ABFC]"
            style={{ rotate: `${angle}deg`, left: "50%", top: "50%" }}
            initial={{ scaleX: 0, x: 20 }}
            animate={{ scaleX: [0, 1, 0], x: [20, 40, 90] }}
            transition={{
              duration: 0.8 / speed,
              ease: EASE_OUT,
              delay: 0.2 / speed,
            }}
          />
        ))}
        <motion.span
          className={`text-[44px] text-white ${big}`}
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            type: "spring",
            visualDuration: 0.4 / speed,
            bounce: 0.45,
            delay: 0.25 / speed,
          }}
        >
          {word}
        </motion.span>
      </div>
    </Frame>
  );
}

function EchoStack({ cycle, speed, words }: SceneProps & { words: string[] }) {
  return (
    <Frame className="bg-[#A800B7]">
      <div
        key={cycle}
        className="absolute inset-0 flex flex-col items-center justify-center gap-1"
      >
        {words.map((word, i) => (
          <motion.span
            key={word}
            className={`text-[36px] text-white ${big}`}
            initial={{ opacity: 0, scale: 1.6, filter: "blur(6px)" }}
            animate={{
              opacity: i === words.length - 1 ? 1 : 0.45,
              scale: 1,
              filter: "blur(0px)",
            }}
            transition={{
              duration: 0.5 / speed,
              ease: EASE_OUT,
              delay: (0.15 + i * 0.25) / speed,
            }}
          >
            {word}
          </motion.span>
        ))}
      </div>
    </Frame>
  );
}

function Mondrian({ cycle, speed, word }: SceneProps & { word: string }) {
  const d = (s: number) => s / speed;
  return (
    <Frame className="bg-[#F4F4F5]">
      <div key={cycle} className="absolute inset-0">
        {[
          {
            cls: "left-[96px] top-0 h-full w-[6px]",
            from: { scaleY: 0 },
            to: { scaleY: 1 },
            origin: "top",
          },
          {
            cls: "left-0 top-[104px] h-[6px] w-full",
            from: { scaleX: 0 },
            to: { scaleX: 1 },
            origin: "left",
          },
          {
            cls: "left-[196px] top-[104px] h-[76px] w-[6px]",
            from: { scaleY: 0 },
            to: { scaleY: 1 },
            origin: "top",
          },
        ].map((line, i) => (
          <motion.span
            key={line.cls}
            className={`absolute bg-[#0E1012] ${line.cls}`}
            style={{ transformOrigin: line.origin }}
            initial={line.from}
            animate={line.to}
            transition={{
              duration: d(0.4),
              ease: EASE_IN_OUT,
              delay: d(0.1 + i * 0.15),
            }}
          />
        ))}
        <motion.span
          className="absolute top-0 left-0 h-[104px] w-[96px] bg-[#A800B7]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: d(0.3), delay: d(0.6) }}
        />
        <motion.span
          className="absolute right-0 bottom-0 h-[70px] w-[88px] bg-[#0E1012]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: d(0.3), delay: d(0.75) }}
        />
        <motion.span
          className={`absolute top-6 left-[118px] text-[40px] text-[#0E1012] ${big}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: d(0.4), ease: EASE_OUT, delay: d(0.9) }}
        >
          {word}
        </motion.span>
      </div>
    </Frame>
  );
}

function SpringNumber({
  cycle,
  speed,
  value,
  caption,
}: SceneProps & { value: string; caption: string }) {
  return (
    <Frame className="bg-[#0E1012]">
      <div
        key={cycle}
        className="absolute inset-0 flex flex-col items-center justify-center"
      >
        <motion.span
          className={`text-[96px] text-white ${big}`}
          initial={{ scale: 0.3, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            type: "spring",
            visualDuration: 0.55 / speed,
            bounce: 0.4,
            delay: 0.15 / speed,
          }}
        >
          {value}
        </motion.span>
        <motion.span
          className="text-small text-[#F0ABFC]"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 / speed, delay: 0.6 / speed }}
        >
          {caption}
        </motion.span>
      </div>
    </Frame>
  );
}

function Squiggle({ cycle, speed, text }: SceneProps & { text: string }) {
  return (
    <Frame className="bg-white">
      <div key={cycle} className="absolute inset-x-[18px] bottom-5">
        <motion.span
          className={`block text-[38px] text-[#0E1012] ${big}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.45 / speed,
            ease: EASE_OUT,
            delay: 0.1 / speed,
          }}
        >
          {text}
        </motion.span>
        <svg
          viewBox="0 0 200 20"
          className="mt-1 h-4 w-[190px] overflow-visible"
        >
          <motion.path
            d="M2 12 C 22 2, 32 20, 52 10 S 82 2, 102 12 S 132 20, 152 9 S 182 4, 198 11"
            fill="none"
            stroke="#A800B7"
            strokeWidth="4"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{
              duration: 0.7 / speed,
              ease: EASE_IN_OUT,
              delay: 0.5 / speed,
            }}
          />
        </svg>
      </div>
    </Frame>
  );
}

function TrackingIn({ cycle, speed, word }: SceneProps & { word: string }) {
  return (
    <Frame className="flex items-center justify-center bg-white">
      <motion.span
        key={cycle}
        className="text-[34px] font-semibold text-[#0E1012]"
        initial={{ letterSpacing: "0.6em", opacity: 0, filter: "blur(6px)" }}
        animate={{ letterSpacing: "-0.03em", opacity: 1, filter: "blur(0px)" }}
        transition={{
          duration: 0.9 / speed,
          ease: EASE_OUT,
          delay: 0.1 / speed,
        }}
      >
        {word}
      </motion.span>
    </Frame>
  );
}

function WaveWipe({
  cycle,
  speed,
  from,
  to,
}: SceneProps & { from: string; to: string }) {
  return (
    <Frame className="bg-[#0E1012]">
      <span
        className={`absolute bottom-5 left-[22px] text-[42px] text-white ${big}`}
      >
        {from}
      </span>
      <motion.div
        key={cycle}
        className="absolute inset-0 bg-[#A800B7]"
        initial={{ clipPath: "circle(0% at 0% 100%)" }}
        animate={{ clipPath: "circle(150% at 0% 100%)" }}
        transition={{
          duration: 0.9 / speed,
          ease: EASE_IN_OUT,
          delay: 0.6 / speed,
        }}
      >
        <span
          className={`absolute bottom-5 left-[22px] text-[42px] text-white ${big}`}
        >
          {to}
        </span>
      </motion.div>
    </Frame>
  );
}

function Rolodex({ cycle, speed, words }: SceneProps & { words: string[] }) {
  return (
    <Frame className="bg-[#0E1012] [perspective:400px]">
      <div
        key={cycle}
        className="absolute inset-0 flex flex-col items-center justify-center gap-2"
      >
        {words.map((word, i) => (
          <motion.span
            key={word}
            className={`text-[34px] text-white ${big}`}
            style={{ transformOrigin: "50% 50% -20px" }}
            initial={{ rotateX: -90, opacity: 0 }}
            animate={{ rotateX: 0, opacity: 1 }}
            transition={{
              duration: 0.5 / speed,
              ease: EASE_OUT,
              delay: (0.15 + i * 0.3) / speed,
            }}
          >
            {word}
          </motion.span>
        ))}
      </div>
    </Frame>
  );
}

function RgbGlitch({ cycle, speed, word }: SceneProps & { word: string }) {
  const burst = {
    duration: 1.4 / speed,
    times: [0, 0.3, 0.34, 0.38, 0.42, 1],
    repeat: 0,
  };
  return (
    <Frame className="flex items-center justify-center bg-black">
      <div key={cycle} className="relative">
        <motion.span
          className={`absolute inset-0 text-[56px] text-[#F0ABFC] mix-blend-screen ${big}`}
          animate={{ x: [0, 0, -6, 4, 0, 0] }}
          transition={burst}
        >
          {word}
        </motion.span>
        <motion.span
          className={`absolute inset-0 text-[56px] text-[#22C55E] mix-blend-screen ${big}`}
          animate={{ x: [0, 0, 6, -3, 0, 0] }}
          transition={burst}
        >
          {word}
        </motion.span>
        <span
          className={`relative text-[56px] text-white mix-blend-screen ${big}`}
        >
          {word}
        </span>
      </div>
    </Frame>
  );
}

function Truchet({ cycle, speed }: SceneProps) {
  const tiles = Array.from({ length: 25 }, (_, i) => i);
  return (
    <Frame className="bg-[#0B0D0C]">
      <div
        key={cycle}
        className="absolute inset-0 grid grid-cols-5 grid-rows-5"
      >
        {tiles.map((i) => (
          <motion.svg
            key={i}
            viewBox="0 0 40 40"
            className="size-full"
            initial={{ rotate: 0 }}
            animate={{ rotate: (i * 7) % 3 === 0 ? 90 : 0 }}
            transition={{
              duration: 0.45 / speed,
              ease: EASE_IN_OUT,
              delay: (0.1 + ((i * 5) % 9) * 0.06) / speed,
            }}
          >
            <path
              d="M20 0 A20 20 0 0 0 0 20 M40 20 A20 20 0 0 0 20 40"
              fill="none"
              stroke="#22C55E"
              strokeWidth="5"
            />
          </motion.svg>
        ))}
      </div>
    </Frame>
  );
}

function CharRise({ cycle, speed, text }: SceneProps & { text: string }) {
  return (
    <Frame className="bg-[#17191B]">
      <div className="absolute inset-x-[18px] bottom-3 overflow-hidden text-[64px] text-white">
        <Letters
          text={text}
          cycle={cycle}
          speed={speed}
          className={big}
          initial={{ y: "100%" }}
          animate={{ y: "0%" }}
          transition={{ duration: 0.6 / speed, ease: EASE_IN_OUT }}
          stagger={0.06}
        />
      </div>
    </Frame>
  );
}

function StripeType({ cycle, speed, word }: SceneProps & { word: string }) {
  const stripes = [0, 1, 2, 3, 4, 5];
  return (
    <Frame className="flex items-center justify-center bg-[#A800B7]">
      <span className={`text-[58px] text-white ${big}`}>{word}</span>
      <div key={cycle} className="absolute inset-0 flex flex-col">
        {stripes.map((i) => (
          <motion.span
            key={i}
            className="flex-1 origin-right bg-[#A800B7]"
            initial={{ scaleX: 1 }}
            animate={{ scaleX: 0 }}
            transition={{
              duration: 0.5 / speed,
              ease: EASE_IN_OUT,
              delay: (0.2 + i * 0.07) / speed,
            }}
          />
        ))}
      </div>
    </Frame>
  );
}

function ZoomWords({ cycle, speed, words }: SceneProps & { words: string[] }) {
  return (
    <Frame className="bg-[#0E1012]">
      <Words
        words={words}
        cycle={cycle}
        speed={speed}
        className={`absolute inset-x-[22px] bottom-5 gap-x-2 text-[36px] text-white ${big}`}
        initial={{ scale: 3, opacity: 0, filter: "blur(10px)" }}
        animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
        transition={{ duration: 0.5 / speed, ease: EASE_OUT }}
        stagger={0.28}
      />
    </Frame>
  );
}

function Marquee({ word, speed }: SceneProps & { word: string }) {
  const rows = [0, 1, 2, 3, 4, 5];
  return (
    <Frame className="bg-black">
      <div className="absolute inset-0 flex flex-col justify-center gap-1">
        {rows.map((row) => (
          <motion.span
            key={row}
            className={`whitespace-nowrap text-[32px] ${big} ${row % 2 ? "text-[#22C55E]" : "text-white/20"}`}
            animate={{ x: row % 2 ? ["0%", "-50%"] : ["-50%", "0%"] }}
            transition={{
              duration: 4 / speed,
              ease: "linear",
              repeat: Infinity,
            }}
          >
            {`${word} ${word} ${word} ${word} `}
          </motion.span>
        ))}
      </div>
    </Frame>
  );
}

function WordCrossfade({
  cycle,
  speed,
  words,
  image,
}: SceneProps & { words: string[]; image: string }) {
  const step = 0.7 / speed;
  return (
    <Frame
      className="bg-cover"
      style={{ backgroundImage: `url(${image})`, backgroundPosition: "40%" }}
    >
      <div key={cycle} className="absolute inset-x-5 bottom-4 h-[48px]">
        {words.map((word, i) => (
          <motion.span
            key={word}
            className={`absolute bottom-0 left-0 text-[48px] text-white ${big}`}
            initial={{ opacity: 0, filter: "blur(8px)" }}
            animate={{
              opacity: i === words.length - 1 ? [0, 1] : [0, 1, 0],
              filter:
                i === words.length - 1
                  ? ["blur(8px)", "blur(0px)"]
                  : ["blur(8px)", "blur(0px)", "blur(8px)"],
            }}
            transition={{
              duration: step * (i === words.length - 1 ? 0.6 : 1.2),
              delay: 0.1 + i * step,
              ease: "easeInOut",
            }}
          >
            {word}
          </motion.span>
        ))}
      </div>
    </Frame>
  );
}

function InkUnderline({ cycle, speed, text }: SceneProps & { text: string }) {
  return (
    <Frame className="flex flex-col items-start justify-center bg-[#F4F4F5] px-6">
      <span className={`text-[56px] text-[#0E1012] ${big}`}>{text}</span>
      <svg
        key={cycle}
        viewBox="0 0 140 14"
        className="h-3.5 w-[140px] overflow-visible"
      >
        <motion.path
          d="M3 9 C 40 3, 90 3, 137 8"
          fill="none"
          stroke="#0E1012"
          strokeWidth="6"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{
            duration: 0.5 / speed,
            ease: EASE_OUT,
            delay: 0.3 / speed,
          }}
        />
      </svg>
    </Frame>
  );
}

function MarkerHighlight({
  cycle,
  speed,
  before,
  marked,
}: SceneProps & { before: string; marked: string }) {
  return (
    <Frame className="bg-white">
      <div
        key={cycle}
        className={`absolute inset-x-[18px] bottom-5 text-[40px] text-[#0E1012] ${big}`}
      >
        <span>{before} </span>
        <span className="relative">
          <motion.span
            className="absolute inset-x-[-4px] bottom-[2px] h-[60%] origin-left rounded-[4px] bg-[#F0ABFC]"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{
              duration: 0.5 / speed,
              ease: EASE_IN_OUT,
              delay: 0.35 / speed,
            }}
          />
          <span className="relative">{marked}</span>
        </span>
      </div>
    </Frame>
  );
}

function StaggerUp({ cycle, speed, lines }: SceneProps & { lines: string[] }) {
  return (
    <Frame className="bg-[#FBE8FD]">
      <Words
        words={lines}
        cycle={cycle}
        speed={speed}
        className={`absolute inset-x-[18px] bottom-4 flex-col text-[30px] text-[#0E1012] ${big}`}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        stagger={0.18}
      />
    </Frame>
  );
}

function RingText({ text, speed }: SceneProps & { text: string }) {
  return (
    <Frame className="flex items-center justify-center bg-[#0E1012]">
      <motion.svg
        viewBox="0 0 120 120"
        className="size-[132px]"
        animate={{ rotate: 360 }}
        transition={{ duration: 9 / speed, ease: "linear", repeat: Infinity }}
      >
        <defs>
          <path
            id="ring-text"
            d="M60 60 m-46 0 a46 46 0 1 1 92 0 a46 46 0 1 1 -92 0"
          />
        </defs>
        <text className="fill-white text-[13px] font-semibold">
          <textPath href="#ring-text">{text}</textPath>
        </text>
      </motion.svg>
      <span className="absolute size-3 rounded-full bg-[#A800B7]" />
    </Frame>
  );
}

function PeriodDrop({ cycle, speed, word }: SceneProps & { word: string }) {
  return (
    <Frame className="flex items-center justify-center bg-white">
      <span
        key={cycle}
        className={`flex items-end text-[38px] text-[#0E1012] ${big}`}
      >
        {word}
        <motion.span
          className="text-[#A800B7]"
          initial={{ y: -120 }}
          animate={{ y: [-120, 0, -18, 0, -5, 0] }}
          transition={{
            duration: 0.9 / speed,
            times: [0, 0.4, 0.6, 0.75, 0.88, 1],
            ease: "easeOut",
            delay: 0.2 / speed,
          }}
        >
          .
        </motion.span>
      </span>
    </Frame>
  );
}

export const FRAMES_SET: SceneSet = [
  {
    1: def("shader-liquid-metal", "bg-[#1A0820]", true, 2.2, (p) => (
      <ShaderType {...p} image={VIOLET} text="ACME 2.0" />
    )),
    2: def("bauhaus-build", "bg-[#0E1012]", true, 2, (p) => <Bauhaus {...p} />),
    3: def("speed-lines", "bg-[#0E1012]", true, 2, (p) => (
      <SpeedLines {...p} word="FAST" />
    )),
    4: def("mask-reveal-up", "bg-[#A800B7] text-white", true, 2, (p) => (
      <MaskLines
        {...p}
        lines={["Out", "Tuesday."]}
        className="bg-[#A800B7] text-white"
      />
    )),
    5: def("trim-burst", "bg-[#0E1012]", true, 1.8, (p) => (
      <TrimBurst {...p} word="LIVE" />
    )),
    6: def("echo-stack", "bg-[#A800B7]", true, 2.2, (p) => (
      <EchoStack {...p} words={["ship", "it", "now"]} />
    )),
  },
  {
    1: def("mondrian-split", "bg-[#F4F4F5]", false, 2.2, (p) => (
      <Mondrian {...p} word="v2.4" />
    )),
    2: def("spring-scale-in", "bg-[#0E1012]", true, 1.8, (p) => (
      <SpringNumber {...p} value="12" caption="changes" />
    )),
    3: def("squiggle", "bg-white", false, 2, (p) => (
      <Squiggle {...p} text="faster sync" />
    )),
    4: def("tracking-in", "bg-white", false, 1.8, (p) => (
      <TrackingIn {...p} word="LEDGER" />
    )),
    5: def("wave-wipe", "bg-[#0E1012]", true, 2.2, (p) => (
      <WaveWipe {...p} from="before" to="after" />
    )),
    6: def("rolodex-flip", "bg-[#0E1012]", true, 2.2, (p) => (
      <Rolodex {...p} words={["fix", "ship", "repeat"]} />
    )),
  },
  {
    1: def("rgb-glitch-text", "bg-black", true, 2, (p) => (
      <RgbGlitch {...p} word="PULSE" />
    )),
    2: def("truchet-flip", "bg-[#0B0D0C]", true, 2, (p) => <Truchet {...p} />),
    3: def("per-character-rise", "bg-[#17191B]", true, 1.8, (p) => (
      <CharRise {...p} text="10.24" />
    )),
    4: def("stripe-type", "bg-[#A800B7]", true, 1.8, (p) => (
      <StripeType {...p} word="SOON" />
    )),
    5: def("zoom-words", "bg-[#0E1012]", true, 2.2, (p) => (
      <ZoomWords {...p} words={["coming", "this", "fall"]} />
    )),
    6: def("infinite-marquee", "bg-black", true, 3, (p) => (
      <Marquee {...p} word="PULSE" />
    )),
  },
  {
    1: def("per-word-crossfade", "bg-[#2A0618]", true, 2.4, (p) => (
      <WordCrossfade
        {...p}
        words={["write.", "sync.", "ship."]}
        image={MAGENTA}
      />
    )),
    2: def("ink-underline", "bg-[#F4F4F5]", false, 1.6, (p) => (
      <InkUnderline {...p} text="fast" />
    )),
    3: def("marker-highlight", "bg-white", false, 1.8, (p) => (
      <MarkerHighlight {...p} before="0.2s" marked="sync" />
    )),
    4: def("staggered-fade-up", "bg-[#FBE8FD]", false, 1.8, (p) => (
      <StaggerUp {...p} lines={["capture", "sync", "share"]} />
    )),
    5: def("ring-text", "bg-[#0E1012]", true, 3, (p) => (
      <RingText {...p} text="write it down, ship it, " />
    )),
    6: def("period-drop", "bg-white", false, 1.8, (p) => (
      <PeriodDrop {...p} word="notes" />
    )),
  },
];
