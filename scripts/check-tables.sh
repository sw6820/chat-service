#!/bin/bash
PGPASSWORD=$DATABASE_PASSWORD psql -h $DATABASE_HOST -U $DATABASE_USERNAME -d $DATABASE_NAME -c "\\dt"