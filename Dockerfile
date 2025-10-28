FROM node:20-alpine AS base
ENV NEXT_TELEMETRY_DISABLED=1
RUN corepack enable && apk add --no-cache openssl
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS prod
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/prisma ./prisma

RUN echo '#!/bin/sh' > /entrypoint.sh && \
    echo 'set -e' >> /entrypoint.sh && \
    echo 'if [ -n "$DATABASE_URL" ]; then' >> /entrypoint.sh && \
    echo '  echo "Running prisma migrate deploy..."' >> /entrypoint.sh && \
    echo '  npx prisma migrate deploy || true' >> /entrypoint.sh && \
    echo 'fi' >> /entrypoint.sh && \
    echo 'node server.js' >> /entrypoint.sh && \
    chmod +x /entrypoint.sh

EXPOSE 3000
CMD ["/entrypoint.sh"]
