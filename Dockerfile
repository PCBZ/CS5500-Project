# Build stage
FROM --platform=$TARGETPLATFORM node:18-alpine as builder

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache openssl openssl-dev

# Copy package.json and package-lock.json
COPY package*.json ./
COPY client/package*.json ./client/
COPY Server/package*.json ./Server/

# Install dependencies with architecture-specific optimizations
RUN npm config set registry https://registry.npmmirror.com && \
    npm run install:all

# Copy source code
COPY . .

# Build client with architecture-specific optimizations
RUN cd client && \
    npm run build

# Production stage
FROM --platform=$TARGETPLATFORM node:18-alpine

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache openssl openssl-dev

# Copy necessary files from builder stage
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/Server ./Server
COPY --from=builder /app/client/build ./client/build

# Install production dependencies with architecture-specific optimizations
RUN npm config set registry https://registry.npmmirror.com && \
    npm install --production && \
    npm install -g concurrently

# Generate Prisma client
RUN cd Server && \
    npx prisma generate

# Expose ports
EXPOSE 3000
EXPOSE 5000

# Start application
CMD ["npm", "run", "start:prod"] 