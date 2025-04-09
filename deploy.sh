#!/bin/bash

# Pull latest changes
git pull

# Install dependencies
npm install

# Build the application
npm run build

# Restart the PM2 process if it exists, otherwise start it
pm2 describe hoproc > /dev/null
if [ $? -eq 0 ]; then
    pm2 restart hoproc
else
    pm2 start npm --name "hoproc" -- start
fi