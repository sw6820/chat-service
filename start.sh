#!/bin/bash

if [ "$1" == "prod" ]; then
  ENV_FILE=".env.prod"
else
  ENV_FILE=".env.local"
fi

docker-compose --env-file $ENV_FILE up -d
