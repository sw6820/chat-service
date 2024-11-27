#!/bin/bash

# Update system and install dependencies
sudo apt update && sudo apt upgrade -y
sudo apt install -y docker.io nginx awscli jq certbot python3-certbot-nginx

# Setup directories
sudo mkdir -p /opt/chat-service/{scripts,envs,logs,backup,nginx}
sudo chown -R ubuntu:ubuntu /opt/chat-service

# Start services
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ubuntu

# Configure Nginx
sudo ln -s /opt/chat-service/nginx/chat-service.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl restart nginx

# Set environment
echo "NODE_ENV=production" >> /opt/chat-service/envs/.env.prod

# Setup SSL (if domain is configured)
if [ -n "$DOMAIN" ]; then
    sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos -m your@email.com
fi
