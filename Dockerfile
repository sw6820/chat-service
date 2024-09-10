# Stage 1: Build the application
FROM node:20-alpine as build

# Set the working directory in the container
WORKDIR /usr/src/chat-service

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci --legacy-peer-deps

# Copy the rest of the application code
COPY . .

# Build the application
RUN npm run build

# Verify that the dist directory was created
echo listed dist
RUN ls -la ./dist

# Stage 2: Prepare production image
FROM node:20-alpine as production

WORKDIR /usr/src/chat-service

# Copy package.json and package-lock.json
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev --legacy-peer-deps

# Copy compiled code from the build stage
COPY --from=build /usr/src/chat-service/dist ./dist

# Install curl for health check
RUN apk add --no-cache curl

# Add a health check to verify if the app is running
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 CMD curl -f http://localhost:3000/health || exit 1

# Expose the port the app runs on
EXPOSE 3000

# Start the application using Node.js
CMD ["node", "dist/main.js"]
