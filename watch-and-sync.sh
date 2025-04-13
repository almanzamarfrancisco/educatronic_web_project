#!/bin/bash

# === CONFIG ===
PC_USER=lucas
PC_IP=192.168.1.70
PC_PROJECT_PATH="/home/lucas/Desktop/projects/educatronic_web_project/front-end_preact"
PI_FRONT_PATH="/home/lucas/Desktop/projects/educatronic_web_project/front-end_preact"
PI_BACK_PATH="/home/lucas/Desktop/projects/educatronic_web_project/backend_mongoose"
WATCH_PATH="$PI_FRONT_PATH/src"  # Or adjust this path as needed

echo "🔁 Watching for changes in: $WATCH_PATH"

# Ensure inotify-tools is available
command -v inotifywait >/dev/null 2>&1 || {
    echo "📦 Installing inotify-tools..."
    sudo apt install inotify-tools
}

inotifywait -m -r -e modify,create,delete --format '%w%f' "$WATCH_PATH" | while read MODIFIED_FILE
do
    echo "📂 File changed: $MODIFIED_FILE"

    # === STEP 1: Send modified file to PC ===
    RELATIVE_PATH=${MODIFIED_FILE#"$PI_FRONT_PATH/"}
    DEST_PATH="$PC_PROJECT_PATH/$RELATIVE_PATH"

    echo "📤 Syncing to PC: $DEST_PATH"
    scp "$MODIFIED_FILE" "$PC_USER@$PC_IP:$DEST_PATH"

    # === STEP 2: Trigger remote build ===
    ssh $PC_USER@$PC_IP <<EOF
cd $PC_PROJECT_PATH
echo "⚙️ Building frontend after change in: $RELATIVE_PATH"
# npm install --silent
yarn build
yarn run tw:build
EOF

    # === STEP 3: Fetch compiled assets ===
    echo "📥 Fetching compiled frontend files..."
    echo "$PC_USER@$PC_IP:$PC_PROJECT_PATH/dist/bundle.js $PI_BACK_PATH/web_root/bundle.js"
    scp $PC_USER@$PC_IP:$PC_PROJECT_PATH/dist/bundle.js $PI_BACK_PATH/web_root/bundle.js
    echo "$PC_USER@$PC_IP:$PC_PROJECT_PATH/src/style/index.css $PI_BACK_PATH/web_root/index.css"
    scp $PC_USER@$PC_IP:$PC_PROJECT_PATH/src/style/index.css $PI_BACK_PATH/web_root/index.css


done
