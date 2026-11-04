#!/bin/sh
# Renders the App Store screenshots (2880×1800) from screens.html with headless Chrome. Rerun if the look changes.
set -e
cd "$(dirname "$0")"
(cd ../.. && npm run build >/dev/null)
cp ../../dist/buddies.global.js .
for scene in hello care play calling; do
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --hide-scrollbars \
    --force-device-scale-factor=2 --window-size=1440,900 --allow-file-access-from-files \
    --screenshot="$PWD/$scene.png" "file://$PWD/screens.html#$scene" 2>/dev/null
  echo "screenshots/$scene.png"
done
rm buddies.global.js
