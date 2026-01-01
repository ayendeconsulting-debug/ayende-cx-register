#!/bin/sh
echo "Running migrations..."
npx prisma migrate deploy

echo "Seeding database..."
node prisma/seed.js || echo "Seed failed or already seeded"

echo "Starting server..."
node src/server.js
