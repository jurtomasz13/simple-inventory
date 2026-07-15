# syntax=docker/dockerfile:1.7

FROM node:24-bookworm-slim AS node-base

RUN apt-get update \
    && apt-get install --no-install-recommends -y ca-certificates openssl \
    && rm -rf /var/lib/apt/lists/*


FROM node-base AS dependencies

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/backend/package.json ./apps/backend/package.json
COPY apps/backend-e2e/package.json ./apps/backend-e2e/package.json
COPY apps/frontend/package.json ./apps/frontend/package.json
COPY libs/prisma-schema/package.json ./libs/prisma-schema/package.json

RUN npm ci --legacy-peer-deps


FROM dependencies AS backend-build

COPY tsconfig.base.json ./tsconfig.base.json
COPY apps/backend ./apps/backend
COPY libs/prisma-schema ./libs/prisma-schema

RUN node node_modules/prisma/build/index.js generate --schema=libs/prisma-schema/prisma/schema.prisma
RUN node node_modules/typescript/bin/tsc -p apps/backend/tsconfig.container.json


FROM dependencies AS frontend-build

ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

COPY tsconfig.base.json ./tsconfig.base.json
COPY apps/frontend ./apps/frontend

RUN node node_modules/vite/bin/vite.js build --config apps/frontend/vite.config.ts


FROM dependencies AS production-dependencies

RUN npm prune --omit=dev --legacy-peer-deps


FROM node-base AS backend

ENV NODE_ENV=production
ENV PORT=3000

WORKDIR /app

COPY package.json ./package.json
COPY --from=production-dependencies /app/node_modules ./node_modules
COPY --from=backend-build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=backend-build /app/apps/backend/dist-container ./apps/backend/dist
COPY libs/prisma-schema/prisma/schema.prisma ./libs/prisma-schema/prisma/schema.prisma
COPY docker/backend-entrypoint.sh ./docker/backend-entrypoint.sh

USER node

EXPOSE 3000

ENTRYPOINT ["sh", "/app/docker/backend-entrypoint.sh"]


FROM nginx:1.27-alpine AS frontend

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=frontend-build /app/apps/frontend/dist /usr/share/nginx/html

EXPOSE 80
