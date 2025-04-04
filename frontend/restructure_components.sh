#!/bin/bash

# Script to restructure React components into a better folder structure
# Each component gets its own folder with the component and its tests

cd "$(dirname "$0")"
COMPONENTS_DIR="src/components"

# Create folders for each component (excluding .test files and index files)
for FILE in "$COMPONENTS_DIR"/*.tsx; do
  # Skip test files and already processed files
  if [[ "$FILE" == *".test.tsx" ]] || [[ -d "${FILE%.tsx}" ]]; then
    continue
  fi
  
  COMPONENT_NAME=$(basename "$FILE" .tsx)
  COMPONENT_DIR="$COMPONENTS_DIR/$COMPONENT_NAME"
  
  # Skip if already a directory
  if [[ -d "$COMPONENT_DIR" ]]; then
    continue
  fi
  
  echo "Creating folder for $COMPONENT_NAME component"
  
  # Create component directory
  mkdir -p "$COMPONENT_DIR"
  
  # Create index.ts file
  cat > "$COMPONENT_DIR/index.ts" << EOF
import $COMPONENT_NAME from './$COMPONENT_NAME';

export default $COMPONENT_NAME;
EOF
  
  # Move component to its folder
  cp "$FILE" "$COMPONENT_DIR/$COMPONENT_NAME.tsx"
  
  # Move test file if it exists
  if [[ -f "$COMPONENTS_DIR/$COMPONENT_NAME.test.tsx" ]]; then
    cp "$COMPONENTS_DIR/$COMPONENT_NAME.test.tsx" "$COMPONENT_DIR/$COMPONENT_NAME.test.tsx"
  fi
done

echo "Component restructuring completed!"
echo "Make sure to update import paths in your codebase before deleting original files."
echo "After verifying everything works, you can delete the original component files from the root components directory." 