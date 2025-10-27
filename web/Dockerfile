# ================================
# Stage 1: Build
# ================================
FROM node:20-alpine AS builder
WORKDIR /app

RUN apk add --no-cache openssl

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .

# 🔧 Fix quyền ghi cho thư mục .next (nếu tồn tại)
RUN mkdir -p .next/cache && chmod -R 777 .next

RUN npm run build

# ================================
# Stage 2: Run (Production)
# ================================
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Tạo user an toàn
RUN addgroup -g 1001 nodejs && adduser -D -u 1001 nextjs -G nodejs

# Copy các file tối thiểu để chạy
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Quyền user non-root
USER nextjs

# Port mặc định Next.js
EXPOSE 3000

# Lệnh khởi chạy
CMD ["node", "server.js"]
