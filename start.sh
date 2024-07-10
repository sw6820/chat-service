#!/bin/bash

if [ "$1" == "production" ]; then
  ENV_FILE=".env.production"
else
  ENV_FILE=".env.local"
fi

docker-compose --env-file $ENV_FILE up -d
