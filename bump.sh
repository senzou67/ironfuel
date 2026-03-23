#!/bin/bash
# Bump version across all 3 files atomically
# Usage: ./bump.sh  (auto-increments) or ./bump.sh 75 (set specific version)

set -e

CURRENT=$(grep -oP '"v":\K[0-9]+' version.json)
if [ -n "$1" ]; then
    NEW=$1
else
    NEW=$((CURRENT + 1))
fi

echo "Bumping version: $CURRENT → $NEW"

# 1. version.json
sed -i "s/\"v\":$CURRENT/\"v\":$NEW/" version.json

# 2. sw.js
sed -i "s/ironfuel-v$CURRENT/ironfuel-v$NEW/" sw.js
sed -i "s/SW_VERSION = $CURRENT/SW_VERSION = $NEW/" sw.js

# 3. index.html — LOCAL_V and all ?v= query strings
sed -i "s/LOCAL_V = $CURRENT/LOCAL_V = $NEW/" index.html
sed -i "s/?v=$CURRENT/?v=$NEW/g" index.html

echo "Done. Files updated:"
grep '"v":' version.json
grep 'SW_VERSION' sw.js
grep 'LOCAL_V' index.html | head -1
