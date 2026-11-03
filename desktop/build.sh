#!/bin/sh
# Builds desktop/build/Buddies.app from the library and the Swift window. Signed ad hoc, for this Mac only.
set -e
cd "$(dirname "$0")"

(cd .. && npm run build)
swift build -c release

app=build/Buddies.app
rm -rf "$app"
mkdir -p "$app/Contents/MacOS" "$app/Contents/Resources"
cp Info.plist "$app/Contents/"
cp "$(swift build -c release --show-bin-path)/Buddies" "$app/Contents/MacOS/"
cp -R web "$app/Contents/Resources/web"
cp ../dist/buddies.global.js "$app/Contents/Resources/web/"
codesign --force --sign - --entitlements Buddies.entitlements "$app"
echo "$app"
