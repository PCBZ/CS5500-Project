# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache python3 make g++ openssl openssl-dev

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
FROM node:20-alpine

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache openssl openssl-dev python3 make g++

# Copy necessary files from builder stage
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/client/build ./client/build
COPY --from=builder /app/Server ./Server

# Install production dependencies with architecture-specific optimizations
RUN npm config set registry https://registry.npmmirror.com && \
    npm install --production && \
    npm install -g concurrently

# Generate Prisma client
RUN cd Server && \
    npx prisma generate

# Rebuild bcrypt module
RUN cd Server && npm rebuild bcrypt --build-from-source

# Expose ports
EXPOSE 3000
EXPOSE 5000

# Start application
CMD ["npm", "run", "start:prod"] 