#!/bin/bash
# Start script for Railway - handles both API and Worker

# Run migrations first
npx prisma migrate deploy

# Check if this is a worker service
if [ "$SERVICE_TYPE" = "worker" ]; then
    echo "Starting Queue Worker..."
    npm run worker
else
    echo "Starting API Server..."
    npm run start
fi