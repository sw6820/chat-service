# Use an official Node.js runtime as a parent image
FROM node:20-alpine

# Set the working directory in the container
WORKDIR /usr/src/chat-service

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Install pm2 globally
RUN npm install -g pm2

# Copy the rest of the application code
COPY . .

# Build the application
RUN npm run build

# Expose the port the app runs on
EXPOSE 3000

# Use pm2 to start the app
CMD ["pm2-runtime", "start", "npm", "--name", "chat-service", "--", "run", "start:prod"]
