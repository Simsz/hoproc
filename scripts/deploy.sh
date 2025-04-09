#!/bin/bash

# Exit on error
set -e

echo "Starting deployment..."

# Pull the latest changes
git pull

# Install dependencies
echo "Installing dependencies..."
npm ci

# Build the app with ESLint disabled
echo "Building the app..."
npm run build

# Stop and restart the application with PM2
# If using PM2, uncomment these lines:
echo "Restarting application..."
pm2 stop hoproc || true
pm2 start npm --name "hoproc" -- start

echo "Deployment complete!" 