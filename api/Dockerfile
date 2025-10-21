# ---- Stage 1: Dependencies ----
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci && npm cache clean --force

# ---- Stage 2: Build ----
FROM node:20-alpine AS build
WORKDIR /app

# ⚠️ PHẢI COPY package.json VÀ tsconfig.json trước khi chạy npm run build
COPY package*.json ./
COPY tsconfig.json ./

# Copy source code
COPY src ./src

# Copy node_modules từ deps
COPY --from=deps /app/node_modules ./node_modules

# Build project (tạo thư mục dist)
RUN npm run build

# ---- Stage 3: Production runtime ----
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/dist ./dist
COPY package*.json ./

RUN npm ci --omit=dev && npm cache clean --force

USER node
ENV PORT=4000
EXPOSE 4000

CMD ["node", "dist/index.js"]
