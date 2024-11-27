#!/bin/bash

# Create necessary directories
mkdir -p /opt/chat-service/envs

echo "Fetching configuration from SSM..."

# Get parameters from SSM and create env file
aws ssm get-parameters-by-path \
    --path "/prod/chat-service/" \
    --recursive \
    --with-decryption \
    --query "Parameters[*].{Name:Name,Value:Value}" \
    --output text | while read -r param_name param_value; do
    param_key=$(basename "$param_name")
    echo "${param_key}=${param_value}" >> /opt/chat-service/envs/.env.prod
done

# Deploy application
docker pull s6820w/chat-service:latest
docker stop chat-service || true
docker rm chat-service || true

docker run -d \
    --name chat-service \
    --network host \
    -v /opt/chat-service/envs/.env.prod:/usr/src/chat-service/envs/.env.prod:ro \
    s6820w/chat-service:latest

##!/bin/bash
#
#APP_DIR="/opt/chat-service"
#ENV_FILE="$APP_DIR/envs/.env.prod"
#DOCKER_IMAGE="s6820w/chat-service:latest"
#
## Update environment from SSM
#aws ssm get-parameters-by-path \
#    --path "/prod/chat-service/" \
#    --recursive \
#    --with-decryption \
#    --query "Parameters[*].{Name:Name,Value:Value}" \
#    --output text | while read -r param_name param_value; do
#    param_key=$(basename "$param_name")
#    echo "${param_key}=${param_value}" >> "$ENV_FILE.tmp"
#done
#
#mv "$ENV_FILE.tmp" "$ENV_FILE"
#chmod 600 "$ENV_FILE"
#
## Deploy application
#docker pull $DOCKER_IMAGE
#docker stop chat-service || true
#docker rm chat-service || true
#
#docker run -d \
#    --name chat-service \
#    --restart unless-stopped \
#    -p 3000:3000 \
#    -v "$ENV_FILE:/usr/src/chat-service/envs/.env.prod:ro" \
#    $DOCKER_IMAGE
