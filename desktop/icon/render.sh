#!/bin/sh
# Renders icon/AppIcon.png (1024×1024, transparent) from the library with headless Chrome. Rerun if the look changes.
set -e
cd "$(dirname "$0")"
(cd ../.. && npm run build >/dev/null)
cp ../../dist/buddies.global.js .
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --hide-scrollbars \
  --force-device-scale-factor=1 --default-background-color=00000000 --window-size=1024,1024 \
  --allow-file-access-from-files --screenshot="$PWD/AppIcon.png" "file://$PWD/icon.html" 2>/dev/null
rm buddies.global.js
echo icon/AppIcon.png
