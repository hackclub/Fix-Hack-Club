# syntax=docker/dockerfile:1

# Base image with the system libs Prisma needs on Alpine.
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# ---- Dependencies (tolerate a missing lockfile) ----
FROM base AS deps
COPY package.json package-lock.json* ./
# The postinstall script runs `prisma generate`, so the schema must be present.
COPY prisma ./prisma
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# ---- Build (the build script runs `prisma generate` then `next build`) ----
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---- Runtime image ----
FROM base AS runner
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

RUN addgroup -g 1001 -S nodejs && adduser -u 1001 -S nextjs -G nodejs

# Next standalone server, static assets, and public files.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Copy the FULL node_modules and the schema so `prisma migrate deploy` /
# `prisma db push` can resolve their transitive deps at container start.
# (Enumerating Prisma's subdirectories is whack-a-mole on Prisma 6.x.)
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

# Bot script (runs alongside Next.js as a background process).
COPY --chown=nextjs:nodejs bot.mjs ./bot.mjs

COPY --chown=nextjs:nodejs docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

USER nextjs
EXPOSE 3000
CMD ["./docker-entrypoint.sh"]
