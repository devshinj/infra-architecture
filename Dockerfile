# syntax=docker/dockerfile:1
# 운영 이미지. deploy/compose.yml 이 runner(앱)와 tools(마이그레이션·일회성 스크립트)를 쓴다.
ARG NODE_VERSION=22

FROM node:${NODE_VERSION}-bookworm-slim AS deps
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# 마이그레이션(drizzle-kit)·backfill(tsx) 처럼 개발 의존성이 필요한 일을 하는 이미지. 앱으로 띄우지 않는다.
FROM deps AS tools
COPY . .
CMD ["npx", "drizzle-kit", "migrate"]

FROM deps AS build
COPY . .
# 빌드는 서버 코드를 불러오지만 DB 에 붙지 않는다. 아래 두 값은 env.ts 검사를 지나가게 하는 가짜이고 운영 이미지에는 남지 않는다.
ENV NEXT_OUTPUT=standalone \
    DATABASE_URL=postgres://build:build@127.0.0.1:1/build \
    AUTH_SECRET=build-only-not-a-secret-0000000000000000
RUN npx next build

# 앱: standalone 출력(server.js + 쓰는 의존성만)이라 node_modules 전체를 싣지 않는다.
FROM node:${NODE_VERSION}-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
USER node
EXPOSE 3000
CMD ["node", "server.js"]
