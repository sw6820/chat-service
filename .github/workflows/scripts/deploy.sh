#!/bin/bash
# .github/workflows/scripts/deploy.sh

set -e

DOCKER_REPO=$1
APP_NAME=$2
DOCKER_TAG=$3
DOCKER_IMAGE="$DOCKER_REPO/$APP_NAME:$DOCKER_TAG"

echo "Starting deployment..."

# Setup AWS config
export AWS_DEFAULT_REGION=$AWS_REGION
aws configure set aws_access_key_id $AWS_ACCESS_KEY_ID
aws configure set aws_secret_access_key $AWS_SECRET_ACCESS_KEY
aws configure set region $AWS_REGION

# Setup directories
APP_DIR="/home/ubuntu/chat-service"
ENV_DIR="$APP_DIR/envs"
mkdir -p $ENV_DIR

# mkdir -p "$APP_DIR/envs"

# Test AWS connectivity
aws sts get-caller-identity || {
    echo "AWS credentials not working. Please check configuration."
    exit 1
}

# Fetch SSM parameters with error checking
echo "Fetching SSM parameters..."
aws ssm get-parameters-by-path \
    --path "/chat-service/production" \
    --recursive \
    --with-decryption \
    --query "Parameters[*].{Name:Name,Value:Value}" \
    --output text || {
    echo "Failed to fetch SSM parameters. Check path and permissions."
    exit 1
}

# Load parameters from SSM
echo "Fetching configuration from SSM..."
aws ssm get-parameters-by-path \
    --path "/prod/chat-service/" \
    --recursive \
    --with-decryption \
    --query "Parameters[*].{Name:Name,Value:Value}" \
    --output text | while read -r param_name param_value; do
    # Extract parameter name without path
    param_key=$(basename "$param_name" | tr '[:lower:]' '[:upper:]')
    param_key=${param_key/DATABASE_HOST/HOST}
    echo "$param_key=$param_value" >> "$ENV_DIR/.env.prod"
    # echo "$param_key=$param_value" >> "$APP_DIR/envs/.env.prod"
done

# # Deploy with Docker
# echo "Deploying container..."
# docker pull your-image:latest
# docker stop chat-service || true
# docker rm chat-service || true

# # Start new container
# docker run -d \
#     --name chat-service \
#     --restart unless-stopped \
#     -v "$APP_DIR/envs/.env.prod:/usr/src/chat-service/envs/.env.prod:ro" \
#     -p 3000:3000 \
#     your-image:latest

# Deploy container
echo "Pulling image: $DOCKER_IMAGE"
docker pull $DOCKER_IMAGE

echo "Stopping existing container..."
docker stop chat-service || true
docker rm chat-service || true

echo "Starting new container..."
docker run -d \
    --name chat-service \
    --restart unless-stopped \
    -v "$ENV_DIR/.env.prod:/usr/src/chat-service/envs/.env.prod:ro" \
    -p 3000:3000 \
    $DOCKER_IMAGE

echo "Deployment completed successfully"
