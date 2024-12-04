#!/bin/bash

# Get the current public IP
PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)

# AWS Route 53 configuration
HOSTED_ZONE_ID="YOUR_HOSTED_ZONE_ID"
DOMAIN_NAME="your-domain.com"

# Create a JSON file for the Route 53 update
cat > /tmp/dns-update.json << EOF
{
  "Comment": "DNS update for EC2 instance",
  "Changes": [
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "${DOMAIN_NAME}",
        "Type": "A",
        "TTL": 300,
        "ResourceRecords": [
          {
            "Value": "${PUBLIC_IP}"
          }
        ]
      }
    }
  ]
}
EOF

# Update Route 53 using AWS CLI
aws route53 change-resource-record-sets \
  --hosted-zone-id ${HOSTED_ZONE_ID} \
  --change-batch file:///tmp/dns-update.json

# Clean up
rm /tmp/dns-update.json

# Log the update
echo "$(date): Updated DNS record for ${DOMAIN_NAME} to ${PUBLIC_IP}" >> /var/log/dns-updates.log
