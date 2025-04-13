#!/bin/bash

# === CONFIG ===
PC_USER=lucas
PC_IP=192.168.1.70
PC_PROJECT_PATH=/home/lucas/Desktop/projects/educatronic_web_project/front-end_preact
PI_DEST_PATH=/home/lucas/Desktop/projects/educatronic_web_project/back-end_preact/web_root

# === STEP 1: Get current branch on Pi ===
cd $PI_DEST_PATH/..
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "🔎 Current branch on Raspberry Pi: $CURRENT_BRANCH"

# === STEP 2: Connect to PC, pull same branch, build ===
ssh $PC_USER@$PC_IP <<EOF
cd $PC_PROJECT_PATH/..
echo "📦 Switching to branch: $CURRENT_BRANCH"
git fetch --all
git checkout $CURRENT_BRANCH
git pull origin $CURRENT_BRANCH
cd front-end_preact
echo "⚙️ Building frontend..."
npm install --silent
yarn build
echo "✅ JS Build complete!"
yarn run tw:build
echo "✅ Tailwind Build complete!"
EOF

# === STEP 3: Copy the built frontend from PC to Raspberry Pi ===
echo "📁 Copying 'dist/bundle.js' from PC to Raspberry Pi..."
scp -r $PC_USER@$PC_IP:$PC_PROJECT_PATH/dist/bundle.js $PI_DEST_PATH/
echo "📁 Copying 'src/style/index.css' from PC to Raspberry Pi..."
scp -r $PC_USER@$PC_IP:$PC_PROJECT_PATH/src/style/index.css $PI_DEST_PATH/

echo "✅ DONE: Frontend from branch '$CURRENT_BRANCH' is now updated on the Pi 💜"
