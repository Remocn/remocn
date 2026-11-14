# Coolify builds this image (Dockerfile build pack). Node 22 runs `next build`
# and `next start`; bun is the package manager. Every base image comes from
# Docker Hub and is cached on the server, so a build doesn't depend on GitHub.
FROM node:22-bookworm-slim

ENV NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000

COPY --from=oven/bun:1.4.2 /usr/local/bin/bun /usr/local/bin/bun

WORKDIR /app

# Dependencies get their own layer, reused until bun.lock changes. Scripts are
# skipped because the root postinstall (fumadocs-mdx) needs the sources; it runs
# after the COPY below.
COPY package.json bun.lock ./
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile --ignore-scripts

COPY . .
RUN bun run postinstall

# Semantic search: embeds the component catalog into .search/ and downloads the
# embedding model there (about 120 MB from huggingface.co); the server reads
# both at runtime and never downloads anything itself. The model is kept in a
# build cache, so only the first build on a server needs that download. A
# failure here does not stop the deploy: without the index the site searches
# by keywords only.
RUN --mount=type=cache,target=/var/cache/remocn-search \
    mkdir -p .search/models \
    && cp -a /var/cache/remocn-search/. .search/models/ \
    && (bun run search:build \
        && cp -a .search/models/. /var/cache/remocn-search/ \
        || echo "WARNING: search index not built, the site will search by keywords only")

# Read while prerendering. Coolify passes these only when they are marked as
# *build* variables in its UI. /showcases fails the build without
# SHOWCASES_API_URL; the OpenPanel keys feed the sponsors traffic numbers.
ARG SHOWCASES_API_URL
ARG NEXT_PUBLIC_OPENPANEL_CLIENT_ID
ARG NEXT_PUBLIC_OPENPANEL_API_URL
ARG OPENPANEL_CLIENT_SECRET
ARG OPENPANEL_PUBLIC_DASHBOARD_URL

# .next/cache survives between builds, so Next recompiles only what changed.
RUN --mount=type=cache,target=/app/.next/cache bun run build

ENV NODE_ENV=production
EXPOSE 3000
CMD ["bun", "run", "start"]
