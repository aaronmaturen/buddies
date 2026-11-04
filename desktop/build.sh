#!/bin/sh
# Builds desktop/build/Fussbuddy.app from the library and the Swift window. Signed ad hoc, for this Mac only.
# --universal builds for Apple silicon and Intel, as store.sh does for the App Store.
set -e
cd "$(dirname "$0")"

archs=""
[ "$1" = "--universal" ] && archs="--arch arm64 --arch x86_64"
(cd .. && npm run build)
swift build -c release $archs

app=build/Fussbuddy.app
rm -rf "$app" build/AppIcon.iconset
mkdir -p "$app/Contents/MacOS" "$app/Contents/Resources" build/AppIcon.iconset
cp Info.plist "$app/Contents/"
cp "$(swift build -c release $archs --show-bin-path)/Fussbuddy" "$app/Contents/MacOS/"
cp -R web "$app/Contents/Resources/web"
cp ../dist/buddies.global.js "$app/Contents/Resources/web/"

# icon/AppIcon.png comes from icon/render.sh.
for size in 16 32 128 256 512; do
  sips -z $size $size icon/AppIcon.png --out build/AppIcon.iconset/icon_${size}x${size}.png >/dev/null
  sips -z $((size * 2)) $((size * 2)) icon/AppIcon.png --out build/AppIcon.iconset/icon_${size}x${size}@2x.png >/dev/null
done
iconutil -c icns build/AppIcon.iconset -o "$app/Contents/Resources/AppIcon.icns"

codesign --force --sign - --entitlements Fussbuddy.entitlements "$app"
echo "$app"
