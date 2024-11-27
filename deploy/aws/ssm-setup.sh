#!/bin/bash

# Basic SSM setup script
aws ssm put-parameter --name "/prod/chat-service/DATABASE_HOST" --value "localhost" --type "SecureString" --overwrite
aws ssm put-parameter --name "/prod/chat-service/DATABASE_PORT" --value "5432" --type "SecureString" --overwrite
aws ssm put-parameter --name "/prod/chat-service/DATABASE_USERNAME" --value "chatadmin" --type "SecureString" --overwrite
aws ssm put-parameter --name "/prod/chat-service/DATABASE_PASSWORD" --value "1234" --type "SecureString" --overwrite
aws ssm put-parameter --name "/prod/chat-service/DATABASE_NAME" --value "chatpostgres" --type "SecureString" --overwrite
aws ssm put-parameter --name "/prod/chat-service/JWT_SECRET" --value "eTl2a14AzJUOfjxi9C3RTglKk0ijdecVJ9a5ZIwsfoo=" --type "SecureString" --overwrite
aws ssm put-parameter --name "/prod/chat-service/CORS_ORIGIN" --value "https://2ca1feb2.chat-service-frontend.pages.dev" --type "SecureString" --overwrite

##!/bin/bash
#
## Function to set SSM parameter
#set_parameter() {
#    local name=$1
#    local value=$2
#    local description=$3
#
#    aws ssm put-parameter \
#        --name "/prod/chat-service/$name" \
#        --value "$value" \
#        --type "SecureString" \
#        --description "$description" \
#        --overwrite
#}
#
## Database credentials
#set_parameter "DATABASE_HOST" "10.0.9.28" "Database host"
#set_parameter "DATABASE_PORT" "5432" "Database port"
#set_parameter "DATABASE_USERNAME" "chatadmin" "Database username"
#set_parameter "DATABASE_PASSWORD" "1234" "Database password"
#set_parameter "DATABASE_NAME" "chatpostgres" "Database name"
#
## JWT Secret
#set_parameter "JWT_SECRET" "eTl2a14AzJUOfjxi9C3RTglKk0ijdecVJ9a5ZIwsfoo=" "JWT signing secret"
#
## Other configuration
#set_parameter "CORS_ORIGIN" "https://2ca1feb2.chat-service-frontend.pages.dev" "CORS origin"
