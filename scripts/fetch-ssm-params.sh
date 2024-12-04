# #!/bin/sh
# # scripts/fetch-ssm-params.sh

# # Exit on any error
# set -e

# # Function to log messages
# log() {
#     echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
# }

# # Function to fetch SSM parameters
# fetch_ssm_parameters() {
#     log "Fetching parameters from SSM..."

#     # Create or clear the environment file
#     ENV_FILE="/usr/src/chat-service/envs/.env.prod"
#     : > "$ENV_FILE"

#     # Add non-sensitive environment variables that were passed to the container
#     echo "NODE_ENV=${NODE_ENV}" >> "$ENV_FILE"
#     echo "PORT=${PORT}" >> "$ENV_FILE"

#     # Fetch parameters from SSM
#     aws ssm get-parameters-by-path \
#         --path "/prod/chat-service/" \
#         --recursive \
#         --with-decryption \
#         --query "Parameters[*].{Name:Name,Value:Value}" \
#         --output json | jq -r '.[] | .Name + "=" + .Value' | while read -r param; do
#         # Extract parameter name without path
#         param_name=$(echo "$param" | cut -d'=' -f1 | rev | cut -d'/' -f1 | rev)
#         param_value=$(echo "$param" | cut -d'=' -f2-)
#         echo "${param_name}=${param_value}" >> "$ENV_FILE"
#     done

#     # Set proper permissions
#     chmod 600 "$ENV_FILE"

#     log "SSM parameters fetched successfully"
# }

# # Function to validate environment file
# validate_env_file() {
#     log "Validating environment file..."

#     required_vars="DATABASE_HOST DATABASE_USERNAME DATABASE_PASSWORD JWT_SECRET"
#     missing_vars=""

#     for var in $required_vars; do
#         if ! grep -q "^${var}=" "/usr/src/chat-service/envs/.env.prod"; then
#             missing_vars="${missing_vars} ${var}"
#         fi
#     done

#     if [ -n "$missing_vars" ]; then
#         log "ERROR: Missing required environment variables:${missing_vars}"
#         exit 1
#     fi

#     log "Environment file validation successful"
# }

# # Main execution
# main() {
#     log "Starting parameter fetch process..."

#     # Check AWS credentials
#     if [ -z "$AWS_ACCESS_KEY_ID" ] || [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
#         log "ERROR: AWS credentials not provided"
#         exit 1
#     fi

#     # Fetch and validate parameters
#     fetch_ssm_parameters
#     validate_env_file

#     log "Parameter fetch process completed"

#     # Execute the main application
#     exec "$@"
# }

# # Run main function with all script arguments
# main "$@"
