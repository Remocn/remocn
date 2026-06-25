export type Orientation = "horizontal" | "vertical";

export type StarsStatus = "idle" | "generating" | "ready";

/** A single stargazer as surfaced by GET /api/stargazers. */
export type Stargazer = {
  login: string;
  avatarUrl: string;
  starredAt: string;
};

/** Exactly the success shape returned by GET /api/stargazers. */
export type StargazersPayload = {
  owner: string;
  repo: string;
  totalStars: number;
  truncated: boolean;
  stargazers: Stargazer[];
};

/** JSON-serializable props fed to the GitHubStars composition + export. */
export type GitHubStarsInputProps = {
  repo: string;
  totalStars: number;
  stargazers: Stargazer[];
  orientation: Orientation;
  accentColor: string;
  speed: number;
  theme: "light" | "dark";
};
