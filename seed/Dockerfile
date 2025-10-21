# ----------------------------
# Stage 1: Cài dependencies
# ----------------------------
FROM node:20-alpine AS deps
WORKDIR /app

# Copy file lock để đảm bảo reproducible build
COPY package*.json ./

# Chỉ cài deps thật sự cần cho script seed (thường chỉ ioredis,...)
RUN npm ci --omit=dev && npm cache clean --force

# ----------------------------
# Stage 2: Runtime
# ----------------------------
FROM node:20-alpine
WORKDIR /app

# Copy node_modules đã build sẵn ở trên
COPY --from=deps /app/node_modules ./node_modules

# Copy source code (chỉ cần scripts và data)
COPY scripts ./scripts

# Thiết lập biến môi trường mặc định (nếu cần)
ENV NODE_ENV=production

# Dùng user không đặc quyền để tăng bảo mật
USER node

# Lệnh chạy chính
CMD ["node", "scripts/seed.js"]
