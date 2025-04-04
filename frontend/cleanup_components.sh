#!/bin/bash

# Script to remove original component files after verifying the new structure works
# Run this only after you've tested the application with the new component structure

cd "$(dirname "$0")"
COMPONENTS_DIR="src/components"

echo "This script will remove the original component files from the components directory."
echo "Make sure you have tested the application with the new structure before continuing."
read -p "Are you sure you want to continue? (y/n): " CONFIRM

if [[ "$CONFIRM" != "y" && "$CONFIRM" != "Y" ]]; then
  echo "Cleanup aborted."
  exit 0
fi

# Remove original component files
echo "Removing original component files..."
for FILE in "$COMPONENTS_DIR"/*.tsx; do
  if [[ -f "$FILE" ]]; then
    COMPONENT_NAME=$(basename "$FILE" .tsx)
    if [[ -d "$COMPONENTS_DIR/$COMPONENT_NAME" ]]; then
      echo "Removing $FILE"
      rm "$FILE"
    fi
  fi
done

# Remove original test files
for FILE in "$COMPONENTS_DIR"/*.test.tsx; do
  if [[ -f "$FILE" ]]; then
    COMPONENT_NAME=$(basename "$FILE" .test.tsx)
    if [[ -d "$COMPONENTS_DIR/$COMPONENT_NAME" ]]; then
      echo "Removing $FILE"
      rm "$FILE"
    fi
  fi
done

# Remove backup files created during the import update process
find src -name "*.bak" -type f -delete

echo "Cleanup completed!" 