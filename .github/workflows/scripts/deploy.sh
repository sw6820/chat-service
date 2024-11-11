#!/bin/bash
# .github/workflows/scripts/deploy.sh

set -e

echo "Starting deployment..."

# Setup directories
APP_DIR="/home/ubuntu/chat-service"
mkdir -p "$APP_DIR/envs"

# Load parameters from SSM
echo "Fetching configuration from SSM..."
aws ssm get-parameters-by-path \
    --path "/prod/chat-service/" \
    --recursive \
    --with-decryption \
    --query "Parameters[*].{Name:Name,Value:Value}" \
    --output text | while read -r param_name param_value; do
    # Extract parameter name without path
    param_key=$(basename "$param_name")
    echo "$param_key=$param_value" >> "$APP_DIR/envs/.env.prod"
done

# Deploy with Docker
echo "Deploying container..."
docker pull your-image:latest
docker stop chat-service || true
docker rm chat-service || true

# Start new container
docker run -d \
    --name chat-service \
    --restart unless-stopped \
    -v "$APP_DIR/envs/.env.prod:/usr/src/chat-service/envs/.env.prod:ro" \
    -p 3000:3000 \
    your-image:latest

echo "Deployment completed successfully"
