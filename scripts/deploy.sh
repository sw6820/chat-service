#!/bin/bash

# Exit on error
set -e

echo "Setting up Cloudflare DNS update service..."

# Copy the update script to system bin
sudo cp "$(dirname "$0")/update-cloudflare.sh" /usr/local/bin/
sudo chmod +x /usr/local/bin/update-cloudflare.sh

# Copy and enable the service
sudo cp "$(dirname "$0")/update-dns.service" /etc/systemd/system/cloudflare-dns-update.service
sudo systemctl daemon-reload
sudo systemctl enable cloudflare-dns-update.service
sudo systemctl start cloudflare-dns-update.service

echo "Cloudflare DNS update service installed and started"

# Run initial DNS update
/usr/local/bin/update-cloudflare.sh

# Your application deployment steps below
# Add your deployment logic here
