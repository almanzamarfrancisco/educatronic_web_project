#!/bin/bash

# Log file for debugging
LOG_FILE="/var/log/getNgrokEndpoint.log"
echo "==== $(date) ====" >> "$LOG_FILE"

# Maximum attempts to wait for Ngrok
MAX_ATTEMPTS=10
ATTEMPT=0

# Wait for Ngrok to generate a random URL
while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    RANDOM_NGROK_URL=$(curl -s http://127.0.0.1:4040/api/tunnels | jq -r '.tunnels[].public_url' | grep '^https://' | grep -v 'educatronic.ngrok.app')

    if [[ ! -z "$RANDOM_NGROK_URL" ]]; then
        echo "Ngrok URL found: $RANDOM_NGROK_URL" | tee -a "$LOG_FILE"
        break
    fi

    echo "Waiting for Ngrok to start... (Attempt $((ATTEMPT+1))/$MAX_ATTEMPTS)" | tee -a "$LOG_FILE"
    sleep 5  # Wait for 5 seconds before trying again
    ((ATTEMPT++))
done

# If we still don't have an Ngrok URL after MAX_ATTEMPTS, exit
if [[ -z "$RANDOM_NGROK_URL" ]]; then
    echo "Error: Ngrok tunnel not available. Exiting." | tee -a "$LOG_FILE"
    exit 1
fi

# Define the bundle.js file path
BUNDLE_JS="/home/lucas/Desktop/projects/educatronic_web_project/backend_mongoose/web_root/bundle.js" 

# Validate that streamUrl is present in bundle.js before replacing it
if grep -q '(dn,{streamUrl:"' "$BUNDLE_JS"; then
    echo "streamUrl found in bundle.js. Replacing URL..." | tee -a "$LOG_FILE"
    
    # Replace the URL inside bundle.js
    sed -i "s#(dn,{streamUrl:\"[^\"]*\"})#(dn,{streamUrl:\"$RANDOM_NGROK_URL\"})#" "$BUNDLE_JS"

    echo "Updated bundle.js with new stream URL: $RANDOM_NGROK_URL" | tee -a "$LOG_FILE"
else
    echo "Error: streamUrl not found in bundle.js. No changes made." | tee -a "$LOG_FILE"
    exit 1
fi
