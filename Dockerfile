# Coolify builds this image. Debian (bookworm) — NOT Alpine — because Remotion's
# headless Chromium needs glibc. Single stage; the Chrome Headless Shell and the
# pre-bundled Remotion serveUrl are baked in so renders start fast at boot.
FROM node:22-bookworm-slim

ENV DEBIAN_FRONTEND=noninteractive \
    NODE_ENV=production \
    PORT=3000

# Chromium runtime libraries + base fonts needed by @remotion/renderer.
RUN apt-get update && apt-get install -y --no-install-recommends \
      ca-certificates \
      fonts-liberation \
      libasound2 \
      libatk-bridge2.0-0 \
      libatk1.0-0 \
      libcups2 \
      libdbus-1-3 \
      libdrm2 \
      libgbm1 \
      libgtk-3-0 \
      libnss3 \
      libpango-1.0-0 \
      libxcomposite1 \
      libxdamage1 \
      libxfixes3 \
      libxkbcommon0 \
      libxrandr2 \
    && rm -rf /var/lib/apt/lists/*

# Bun (the repo's package manager + runtime) — copied from the official image.
COPY --from=oven/bun:1 /usr/local/bin/bun /usr/local/bin/bun

WORKDIR /app

# Install deps first for better layer caching. Requires bun.lock to match
# package.json — run `bun install` locally after dependency changes and commit
# the updated lockfile before building.
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# App source + build.
COPY . .
RUN bun run build

# Bake the Chrome Headless Shell into the image (no slow runtime download).
RUN bunx remotion browser ensure

# Pre-bundle the Remotion entry → .remotion-bundle/ (serveUrl ready at boot).
RUN bun run bundle:remotion

EXPOSE 3000

# next start (matches `bun run start` in package.json).
CMD ["bun", "run", "start"]
