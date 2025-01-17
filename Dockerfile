# Stage 1: Build the application
FROM node:20-alpine as build

# Add necessary build tools
RUN apk add --no-cache python3 make g++ \
    && npm install -g rimraf

# Set the working directory in the container
WORKDIR /usr/src/chat-service

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies with specific flags for better security and performance
RUN npm ci --legacy-peer-deps \
    --ignore-scripts \
    --no-optional \
    && npm cache clean --force

# Copy the rest of the application code
COPY . .

# Build the application
RUN npm run build && npm prune --production

# Remove development dependencies
# RUN npm prune --production

# Stage 2: Prepare production image
FROM node:20-alpine as production

# Add curl for health checks and necessary security updates
RUN apk add --no-cache \
    curl \
    aws-cli \
    jq \
    postgresql-client \
    && apk upgrade --no-cache \
    && addgroup -g 1001 nodejs \
    && adduser -S -u 1001 -G nodejs nodejs \
    && npm install -g pm2

# Set working directory
WORKDIR /usr/src/chat-service

# Copy package.json and package-lock.json
# COPY package*.json ./

# Create necessary directories with proper permissions
# RUN mkdir -p /usr/src/chat-service/{envs,scripts} \
    # && mkdir -p /usr/src/chat-service/scripts \
    # && chown -R nodejs:nodejs /usr/src/chat-service

# Copy built assets from build stage
COPY --from=build --chown=nodejs:nodejs /usr/src/chat-service/dist ./dist
COPY --from=build --chown=nodejs:nodejs /usr/src/chat-service/node_modules ./node_modules
COPY --from=build /usr/src/chat-service/envs ./envs
COPY --from=build /usr/src/chat-service/ecosystem.config.js ./ecosystem.config.js


# Create script to fetch SSM parameters

# COPY --chown=nodejs:nodejs deploy/scripts/deploy.sh ./scripts/
# RUN chmod +x ./scripts/deploy.sh

# Set environment variables max-old-space-size 512 because t2.micro is 1GB RAM
ENV NODE_ENV=production \
    PORT=3000 \
    NODE_OPTIONS="--max-old-space-size=512" \ 
    NPM_CONFIG_LOGLEVEL=warn
#    AWS_DEFAULT_REGION=ap-northeast-2

# Switch to non-root user
USER nodejs

# Expose the port the app runs on
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

## Install production dependencies only
#RUN npm ci --omit=dev --legacy-peer-deps
#
## Copy compiled code from the build stage
#COPY --from=build /usr/src/chat-service/dist ./dist
#
## Install curl for health check
#RUN apk add --no-cache curl
#
## Add a health check to verify if the app is running
#HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 CMD curl -f http://localhost:3000/health || exit 1



## Switch to non-root user
# USER nodejs

# Start the application using Node.js
# CMD ["node", "dist/main.js"]
CMD ["pm2-runtime", "start", "/usr/src/chat-service/ecosystem.config.js"]
# ENTRYPOINT ["/usr/src/chat-service/workflows/scripts/deploy.sh"]
# CMD ["npm", "run", "start:prod"]
