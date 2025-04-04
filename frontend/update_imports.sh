#!/bin/bash

# Script to update import paths for the new component structure
# This will update all imports from './ComponentName' to './ComponentName/ComponentName'
# or to './ComponentName' (index exports)

cd "$(dirname "$0")"
COMPONENTS_DIR="src/components"

# List of components that have been restructured
COMPONENTS=()
for DIR in "$COMPONENTS_DIR"/*/; do
  COMPONENT=$(basename "$DIR")
  COMPONENTS+=("$COMPONENT")
done

echo "Updating import paths for components: ${COMPONENTS[*]}"

# Find all .tsx and .ts files in the src directory
find src -type f \( -name "*.tsx" -o -name "*.ts" \) | while read -r FILE; do
  # Skip files in component directories that are the component itself or its index
  if [[ "$FILE" == *"/index.ts" ]] || [[ "$FILE" =~ .*/([^/]+)/\1\.tsx$ ]]; then
    continue
  fi
  
  # Check if this file imports any of our components
  NEEDS_UPDATE=false
  for COMPONENT in "${COMPONENTS[@]}"; do
    if grep -q "import.*from.*['\"]\.\/\.?\/?$COMPONENT['\"]" "$FILE"; then
      NEEDS_UPDATE=true
      break
    fi
  done
  
  if [ "$NEEDS_UPDATE" = true ]; then
    echo "Updating imports in $FILE"
    
    # Make a backup
    cp "$FILE" "$FILE.bak"
    
    # Update the imports
    for COMPONENT in "${COMPONENTS[@]}"; do
      # Update relative imports like './Component' or '../Component'
      sed -i '' -E "s/import(.*)from(['\"]\\.|\\.\\.)\\/(Components\\/)?$COMPONENT(['\"])/import\\1from\\2\\/$COMPONENT\\4/g" "$FILE"
    done
  fi
done

echo "Import paths updated!"
echo "Please review the changes and test the application before removing the original component files." 
 