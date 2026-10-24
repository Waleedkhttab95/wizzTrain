# ── Build stage ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Manifests first, so `npm ci` is cached until a dependency actually changes.
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
RUN npm ci

COPY packages/shared ./packages/shared
COPY apps/api ./apps/api

# The shared contracts must be compiled before the API that imports them.
RUN npm run build --workspace @wizzapp/shared \
 && npx --workspace @wizzapp/api prisma generate \
 && npm run build --workspace @wizzapp/api

# Drop dev dependencies from the tree we are about to copy forward.
RUN npm prune --omit=dev

# ── Runtime stage ────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

# dumb-init reaps zombies and forwards SIGTERM, which is what makes Nest's
# shutdown hooks actually fire on `docker stop`.
RUN apk add --no-cache dumb-init

COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder --chown=node:node /app/packages/shared/package.json ./packages/shared/
COPY --from=builder --chown=node:node /app/apps/api/dist ./apps/api/dist
COPY --from=builder --chown=node:node /app/apps/api/package.json ./apps/api/
COPY --from=builder --chown=node:node /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder --chown=node:node /app/package.json ./

USER node
EXPOSE 4000

# Migrations are applied at start-up so a deploy can never run application code
# against an older schema.
ENTRYPOINT ["dumb-init", "--"]
CMD ["sh", "-c", "npx --workspace @wizzapp/api prisma migrate deploy && node apps/api/dist/main.js"]
