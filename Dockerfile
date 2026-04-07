# ─────────────────────────────────────────
# Base image — Node.js LTS
# ─────────────────────────────────────────
FROM node:20-alpine

# ✅ FIX: Install OpenSSL (required for Prisma)
RUN apk add --no-cache openssl

# Set working directory inside container
WORKDIR /app

# Copy package files first (layer caching — faster rebuilds)
COPY package*.json ./

# Install dependencies
RUN npm install --omit=dev

# Copy Prisma schema before generating client
COPY prisma ./prisma

# Generate Prisma client
RUN npx prisma generate

# Copy rest of source code
COPY . .

# Expose app port
EXPOSE 3000

# Start the server
CMD ["node", "server.js"]