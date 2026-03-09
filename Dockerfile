# =============================================================================
# VILLA PARIS GESTIONALE - DOCKERFILE
# Multi-stage build for Next.js 15 with Prisma and PostgreSQL
# =============================================================================

# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build Next.js
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
# ExcelJS e dipendenze (serverExternalPackages: non bundlati, servono nel runner)
COPY --from=builder /app/node_modules/exceljs ./node_modules/exceljs
COPY --from=builder /app/node_modules/archiver ./node_modules/archiver
COPY --from=builder /app/node_modules/archiver-utils ./node_modules/archiver-utils
COPY --from=builder /app/node_modules/unzipper ./node_modules/unzipper
COPY --from=builder /app/node_modules/dayjs ./node_modules/dayjs
COPY --from=builder /app/node_modules/saxes ./node_modules/saxes
COPY --from=builder /app/node_modules/fast-csv ./node_modules/fast-csv
COPY --from=builder /app/node_modules/bl ./node_modules/bl
COPY --from=builder /app/node_modules/readable-stream ./node_modules/readable-stream

# Copy entrypoint
COPY docker/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

# Create directories for uploads
RUN mkdir -p ./public/uploads ./public/planimetrie
RUN chown -R nextjs:nodejs ./public

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

ENTRYPOINT ["./entrypoint.sh"]
