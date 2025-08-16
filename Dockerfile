# Stage 1: Install dependencies
#------------------------------------------------------------------------------------
FROM node:18-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci --legacy-peer-deps; \
  elif [ -f pnpm-lock.yaml ]; then yarn global add pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found. Please use yarn, npm, or pnpm." && exit 1; \
  fi

# Stage 2: Build the application
#------------------------------------------------------------------------------------
FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Add your specific NEXT_PUBLIC_ environment variables
ARG NEXT_PUBLIC_POCKETBASE_URL
ARG NEXT_PUBLIC_SHOP_LATITUDE
ARG NEXT_PUBLIC_SHOP_LONGITUDE

# Set these as environment variables so Next.js can use them during build
ENV NEXT_PUBLIC_POCKETBASE_URL=${NEXT_PUBLIC_POCKETBASE_URL}
ENV NEXT_PUBLIC_SHOP_LATITUDE=${NEXT_PUBLIC_SHOP_LATITUDE}
ENV NEXT_PUBLIC_SHOP_LONGITUDE=${NEXT_PUBLIC_SHOP_LONGITUDE}
ENV NEXT_TELEMETRY_DISABLED 1

RUN \
  if [ -f yarn.lock ]; then yarn build; \
  elif [ -f package-lock.json ]; then npm run build; \
  elif [ -f pnpm-lock.yaml ]; then pnpm run build; \
  else echo "Lockfile not found. Please use yarn, npm, or pnpm." && exit 1; \
  fi

# Stage 3: Production image
#------------------------------------------------------------------------------------
FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME 0.0.0.0
CMD ["node", "server.js"]