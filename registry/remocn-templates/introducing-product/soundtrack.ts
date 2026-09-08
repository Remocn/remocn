/**
 * Original 120 BPM instrumental + action accents, generated entirely from code.
 * No samples, network requests, or audio licensing dependencies. MIT, like the
 * template. Replace with audioSrc or switch sound off to use your own score.
 */
import { INTRODUCING_DURATION } from "./motion";

export const SCORE_SAMPLE_RATE = 22050;
const TAU = Math.PI * 2;

export function createIntroducingScore() {
  const count = SCORE_SAMPLE_RATE * INTRODUCING_DURATION;
  const samples = new Float32Array(count);
  let seed = 21917;
  const noise = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) | 0;
    return (seed >>> 0) / 2147483648 - 1;
  };
  const add = (
    start: number,
    duration: number,
    fn: (t: number, i: number) => number,
  ) => {
    const offset = Math.round(start * SCORE_SAMPLE_RATE);
    const length = Math.min(
      Math.round(duration * SCORE_SAMPLE_RATE),
      count - offset,
    );
    for (let i = 0; i < length; i++)
      samples[offset + i] += fn(i / SCORE_SAMPLE_RATE, i);
  };
  // A quiet, breathing harmonic bed; four two-bar chords.
  const chords = [
    [130.813, 164.814, 195.998],
    [110, 130.813, 164.814],
    [87.307, 130.813, 174.614],
    [97.999, 146.832, 195.998],
  ];
  for (let bar = 0; bar < 8; bar++) {
    const chord = chords[bar % chords.length];
    add(bar * 4, 4.8, (t) => {
      const env =
        Math.min(1, t / 0.65) * Math.min(1, Math.max(0, (4.8 - t) / 0.85));
      return (
        chord.reduce(
          (v, f) =>
            v +
            Math.sin(TAU * f * t + Math.sin(TAU * 0.16 * t) * 0.2) * 0.013 +
            Math.sin(TAU * (f * 1.003) * t) * 0.008,
          0,
        ) * env
      );
    });
  }
  for (let beat = 0; beat < 59; beat++) {
    const at = beat * 0.5;
    // Dry, soft transient and short low kick. Space after the final lockup.
    if (beat % 2 === 0)
      add(
        at,
        0.28,
        (t) =>
          Math.sin(TAU * (48 * t + 5 * (1 - Math.exp(-t * 26)))) *
          Math.exp(-t * 18) *
          0.19,
      );
    if (beat % 4 === 2)
      add(
        at,
        0.15,
        (t) =>
          noise() * Math.exp(-t * 45) * 0.038 +
          Math.sin(TAU * 180 * t) * Math.exp(-t * 40) * 0.025,
      );
    add(
      at + 0.25,
      0.042,
      (t) => noise() * Math.exp(-t * 120) * (beat % 4 === 3 ? 0.023 : 0.012),
    );
    const root = chords[Math.floor(at / 4) % 4][0] / 2;
    add(
      at,
      0.37,
      (t) =>
        (Math.sin(TAU * root * t) + Math.sin(TAU * root * 2 * t) * 0.16) *
        Math.min(1, t * 100) *
        Math.exp(-t * 9) *
        0.055,
    );
  }
  // A sparse plucked motif with two quiet echoes.
  const notes = [
    523.251, 659.255, 587.33, 391.995, 440, 523.251, 391.995, 329.628,
  ];
  for (let i = 0; i < 32; i++) {
    const at = i * 0.875 + 0.5;
    for (let echo = 0; echo < 3; echo++)
      add(at + echo * 0.25, 0.9, (t) => {
        const f = notes[i % notes.length];
        const env = Math.min(1, t * 160) * Math.exp(-t * 8);
        return (
          (Math.sin(TAU * f * t) + Math.sin(TAU * f * 2 * t) * 0.15) *
          env *
          0.025 *
          0.33 ** echo
        );
      });
  }
  // Transitions use filtered noise sweeps and soft tonal landings.
  for (const hit of [2.5, 5, 9, 13, 18, 22, 26, 29]) {
    let smoothed = 0;
    add(hit - 0.24, 0.44, (t) => {
      smoothed = smoothed * 0.85 + noise() * 0.15;
      return smoothed * Math.sin((Math.PI * t) / 0.44) ** 2 * 0.1;
    });
    add(
      hit,
      0.8,
      (t) =>
        (Math.sin(TAU * 523.251 * t) + Math.sin(TAU * 783.991 * t) * 0.4) *
        Math.exp(-t * 7) *
        0.035,
    );
  }
  // PCM WAV is deterministic in the browser and in the renderer.
  const bytes = new Uint8Array(44 + count * 2);
  const view = new DataView(bytes.buffer);
  const ascii = (at: number, str: string) => {
    for (let i = 0; i < str.length; i++) bytes[at + i] = str.charCodeAt(i);
  };
  ascii(0, "RIFF");
  view.setUint32(4, 36 + count * 2, true);
  ascii(8, "WAVE");
  ascii(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, SCORE_SAMPLE_RATE, true);
  view.setUint32(28, SCORE_SAMPLE_RATE * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  ascii(36, "data");
  view.setUint32(40, count * 2, true);
  for (let i = 0; i < count; i++) {
    const t = i / SCORE_SAMPLE_RATE;
    const fade = Math.min(1, t / 0.05, (INTRODUCING_DURATION - t) / 1.6);
    view.setInt16(
      44 + i * 2,
      Math.round(Math.tanh(samples[i] * 6.8) * fade * 30000),
      true,
    );
  }
  return bytes;
}

let cachedScore: string | undefined;
export function introducingScoreDataUri() {
  if (cachedScore) return cachedScore;
  const bytes = createIntroducingScore();
  let binary = "";
  for (let i = 0; i < bytes.length; i += 16384)
    binary += String.fromCharCode(...bytes.subarray(i, i + 16384));
  cachedScore = `data:audio/wav;base64,${btoa(binary)}`;
  return cachedScore;
}
