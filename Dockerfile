# Builds and runs the stdio MCP server. Keyless tools work with no env; set DRAFTKINGS_API_KEY for the rest.
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json tsconfig.json ./
RUN npm ci --ignore-scripts
COPY src ./src
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json LICENSE ./
RUN npm ci --omit=dev --ignore-scripts
COPY --from=build /app/dist ./dist
USER node
ENTRYPOINT ["node", "dist/cli.js"]
