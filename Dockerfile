# Build stage
FROM node:18-alpine as builder

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./
COPY client/package*.json ./client/
COPY Server/package*.json ./Server/

# Install dependencies
RUN npm run install:all

# Copy source code
COPY . .

# Build client
RUN cd client && npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy necessary files from builder stage
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/Server ./Server
COPY --from=builder /app/client/build ./client/build

# Install production dependencies
RUN npm install --production

# Expose ports
EXPOSE 3000
EXPOSE 5000

# Start application
CMD ["npm", "run", "start:prod"] 