#!/bin/bash

# Load environment variables
source "$(dirname "$0")/../envs/.env.prod"

# EC2 specific endpoints
EC2_PUBLIC_IP="3.36.98.23"
EC2_PRIVATE_IP="10.0.9.28"
EC2_INSTANCE_ID="i-0d117cc07fd0d5146"
EC2_REGION="ap-northeast-2"

# Function to get EC2 metadata
get_ec2_metadata() {
    # EC2 metadata endpoint
    local metadata_endpoint="http://169.254.169.254/latest/meta-data"
    local token_endpoint="http://169.254.169.254/latest/api/token"
    
    # Get IMDSv2 token
    TOKEN=$(curl -X PUT -H "X-aws-ec2-metadata-token-ttl-seconds: 21600" "$token_endpoint")
    
    # Get metadata with token
    curl -H "X-aws-ec2-metadata-token: $TOKEN" -s "$metadata_endpoint/$1"
}

# Function to get public IP with multiple fallbacks
get_public_ip() {
    # Try EC2 metadata service first (most reliable for EC2)
    PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)
    
    # If metadata service fails, try backup services
    if [ -z "$PUBLIC_IP" ]; then
        PUBLIC_IP=$(curl -s -m 5 https://checkip.amazonaws.com) || \
        PUBLIC_IP=$(curl -s -m 5 https://api.ipify.org)
    fi

    echo "$PUBLIC_IP"
}

# Get the instance public IP
PUBLIC_IP=$(get_public_ip)

# Verify we got an IP
if [[ ! $PUBLIC_IP =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "Error: Could not get public IP from any service"
    exit 1
fi

echo "Successfully obtained public IP: $PUBLIC_IP"

# Update Cloudflare DNS for API backend
curl -X PUT "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/dns_records/$DNS_RECORD_ID" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data "{
    \"type\":\"A\",
    \"name\":\"api.$DOMAIN_NAME\",
    \"content\":\"$PUBLIC_IP\",
    \"ttl\":1,
    \"proxied\":true
  }"

# Log the update
echo "$(date): Updated Cloudflare DNS for api.$DOMAIN_NAME to $PUBLIC_IP" >> /var/log/cloudflare-updates.log

# Verify the DNS update
CURRENT_IP=$(dig +short "api.$DOMAIN_NAME")
if [ "$CURRENT_IP" != "$PUBLIC_IP" ]; then
    echo "Warning: DNS might not be propagated yet. Current: $CURRENT_IP, Expected: $PUBLIC_IP"
else
    echo "DNS update verified successfully!"
fi
