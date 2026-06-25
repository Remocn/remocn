import "server-only";

/**
 * Strict server-side validation of the render payload. Renders cost real CPU on
 * the box, so this is the gate that stops a crafted/oversized request from
 * blowing up Chromium: caps the stargazer count + string sizes, enums the
 * orientation/theme, clamps the numbers, and only lets http(s) avatar URLs
 * through (avatars are fetched by the headless browser → http(s)-only narrows
 * the SSRF surface). Throws a typed 400 error on anything outside the rules.
 */

export type Orientation = "horizontal" | "vertical";
export type Theme = "light" | "dark";

export interface RenderStargazer {
  login: string;
  avatarUrl: string;
  /** ISO date string, e.g. "2021-03-04" */
  starredAt: string;
}

export interface RenderInput {
  repo: string;
  totalStars: number;
  stargazers: RenderStargazer[];
  orientation: Orientation;
  accentColor: string;
  speed: number;
  theme: Theme;
}

/** Thrown on invalid input; carries the HTTP status the API route should map to. */
export class RenderInputError extends Error {
  readonly status = 400 as const;
  constructor(message: string) {
    super(message);
    this.name = "RenderInputError";
  }
}

// --- Limits ----------------------------------------------------------------
const MAX_STARGAZERS = 60; // matches the composition's own downsample cap
const MAX_REPO_LEN = 200;
const MAX_LOGIN_LEN = 100;
const MAX_AVATAR_URL_LEN = 512;
const MAX_STARRED_AT_LEN = 40;
const MAX_TOTAL_STARS = 100_000_000;
const MIN_SPEED = 1;
const MAX_SPEED = 4;

const HEX_COLOR = /^#[0-9a-fA-F]{3,8}$/;
const HTTP_URL = /^https?:\/\//i;

const DEFAULT_ACCENT = "#ffbb00";
const DEFAULT_SPEED = 1;
const DEFAULT_THEME: Theme = "light";

// --- Field helpers (pure) --------------------------------------------------

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function requireString(value: unknown, field: string, maxLen: number): string {
  if (typeof value !== "string") {
    throw new RenderInputError(`"${field}" must be a string`);
  }
  if (value.length === 0) {
    throw new RenderInputError(`"${field}" must not be empty`);
  }
  if (value.length > maxLen) {
    throw new RenderInputError(`"${field}" exceeds ${maxLen} characters`);
  }
  return value;
}

function requireFiniteNumber(value: unknown, field: string): number {
  const n = typeof value === "string" ? Number(value) : value;
  if (typeof n !== "number" || !Number.isFinite(n)) {
    throw new RenderInputError(`"${field}" must be a finite number`);
  }
  return n;
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function parseStargazer(value: unknown, index: number): RenderStargazer {
  if (!isPlainObject(value)) {
    throw new RenderInputError(`stargazers[${index}] must be an object`);
  }
  const login = requireString(value.login, `stargazers[${index}].login`, MAX_LOGIN_LEN);
  const avatarUrl = requireString(
    value.avatarUrl,
    `stargazers[${index}].avatarUrl`,
    MAX_AVATAR_URL_LEN,
  );
  if (!HTTP_URL.test(avatarUrl)) {
    throw new RenderInputError(
      `stargazers[${index}].avatarUrl must be an http(s) URL`,
    );
  }
  const starredAt = requireString(
    value.starredAt,
    `stargazers[${index}].starredAt`,
    MAX_STARRED_AT_LEN,
  );
  return { login, avatarUrl, starredAt };
}

// --- Public entrypoint -----------------------------------------------------

/**
 * Validate + normalize an untrusted request body into render-ready props.
 * Cosmetic fields (accentColor, speed, theme) default when omitted; data fields
 * (repo, totalStars, stargazers, orientation) are required.
 */
export function parseRenderInput(body: unknown): RenderInput {
  if (!isPlainObject(body)) {
    throw new RenderInputError("request body must be a JSON object");
  }

  const repo = requireString(body.repo, "repo", MAX_REPO_LEN);

  const totalStars = Math.floor(
    clamp(requireFiniteNumber(body.totalStars, "totalStars"), 0, MAX_TOTAL_STARS),
  );

  if (!Array.isArray(body.stargazers)) {
    throw new RenderInputError(`"stargazers" must be an array`);
  }
  if (body.stargazers.length > MAX_STARGAZERS) {
    throw new RenderInputError(
      `"stargazers" exceeds the ${MAX_STARGAZERS}-item limit`,
    );
  }
  const stargazers = body.stargazers.map(parseStargazer);

  if (body.orientation !== "horizontal" && body.orientation !== "vertical") {
    throw new RenderInputError(`"orientation" must be "horizontal" or "vertical"`);
  }
  const orientation: Orientation = body.orientation;

  let accentColor = DEFAULT_ACCENT;
  if (body.accentColor !== undefined) {
    accentColor = requireString(body.accentColor, "accentColor", 32);
    if (!HEX_COLOR.test(accentColor)) {
      throw new RenderInputError(`"accentColor" must be a hex color (e.g. #ffbb00)`);
    }
  }

  let speed = DEFAULT_SPEED;
  if (body.speed !== undefined) {
    speed = clamp(requireFiniteNumber(body.speed, "speed"), MIN_SPEED, MAX_SPEED);
  }

  let theme: Theme = DEFAULT_THEME;
  if (body.theme !== undefined) {
    if (body.theme !== "light" && body.theme !== "dark") {
      throw new RenderInputError(`"theme" must be "light" or "dark"`);
    }
    theme = body.theme;
  }

  return { repo, totalStars, stargazers, orientation, accentColor, speed, theme };
}
