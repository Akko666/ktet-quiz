#!/bin/bash

# Toggle between normal and yolo modes in Gemini CLI settings
# Usage: ./toggle-mode.sh [yolo|normal]

SETTINGS_FILE="gemini-settings.json"
MODE=${1:-toggle}

# Function to get current mode
get_current_mode() {
    if [ -f "$SETTINGS_FILE" ]; then
        grep -o '"currentMode": "[^"]*"' "$SETTINGS_FILE" | grep -o '"[^"]*"$' | tr -d '"'
    else
        echo "normal"
    fi
}

# Function to set mode
set_mode() {
    local new_mode=$1
    if [ -f "$SETTINGS_FILE" ]; then
        # Create backup
        cp "$SETTINGS_FILE" "${SETTINGS_FILE}.backup"

        # Update the currentMode in the JSON file
        sed -i "s/\"currentMode\": \"[^\"]*\"/\"currentMode\": \"$new_mode\"/" "$SETTINGS_FILE"

        echo "✅ Switched to $new_mode mode"
        echo "📁 Backup created: ${SETTINGS_FILE}.backup"
    else
        echo "❌ Settings file not found: $SETTINGS_FILE"
        exit 1
    fi
}

# Main logic
current_mode=$(get_current_mode)

case $MODE in
    "yolo")
        set_mode "yolo"
        ;;
    "normal")
        set_mode "normal"
        ;;
    "toggle")
        if [ "$current_mode" = "yolo" ]; then
            set_mode "normal"
        else
            set_mode "yolo"
        fi
        ;;
    "status")
        echo "Current mode: $current_mode"
        ;;
    *)
        echo "Usage: $0 {yolo|normal|toggle|status}"
        echo "  yolo   - Switch to yolo mode"
        echo "  normal - Switch to normal mode"
        echo "  toggle - Toggle between yolo and normal"
        echo "  status - Show current mode"
        exit 1
        ;;
esac