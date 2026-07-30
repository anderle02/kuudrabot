FROM node:24-alpine AS base
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/package.json
COPY apps/worker/package.json apps/worker/package.json
RUN npm ci

FROM base AS development
COPY . .
EXPOSE 8080
CMD ["npm", "run", "dev", "--workspace=apps/worker"]

FROM base AS build
COPY . .
RUN npm run build --workspace=packages/shared \
    && npm run build --workspace=apps/worker
RUN npx prisma generate --schema=apps/worker/prisma/schema.prisma
RUN npm prune --omit=dev

FROM node:24-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/shared/dist ./packages/shared/dist
COPY --from=build /app/apps/worker/dist ./apps/worker/dist
COPY --from=build /app/scripts/healthcheck.js ./healthcheck.js
EXPOSE 8080
USER node
CMD ["node", "apps/worker/dist/index.js"]