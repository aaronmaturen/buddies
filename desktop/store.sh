#!/bin/sh
# Builds build/Fussbuddy.pkg for the Mac App Store: a universal app signed for distribution with its provisioning
# profile, in an installer package signed for upload. Needs the Apple Distribution and Mac Installer Distribution
# certificates in the keychain (Xcode → Settings → Accounts → Manage Certificates).
#   desktop/store.sh path/to/Fussbuddy.provisionprofile
set -e
cd "$(dirname "$0")"

profile=${1:?usage: store.sh path/to/Fussbuddy.provisionprofile}
team=$(security cms -D -i "$profile" | plutil -extract TeamIdentifier.0 raw -)
pick() { security find-identity -v | grep "$1" | grep "($team)" | head -1 | sed 's/.*"\(.*\)"/\1/'; }
app_id=$(pick "Apple Distribution\|3rd Party Mac Developer Application")
installer_id=$(pick "3rd Party Mac Developer Installer\|Mac Installer Distribution")
[ -n "$app_id" ] || { echo "No Apple Distribution certificate for team $team" >&2; exit 1; }
[ -n "$installer_id" ] || { echo "No Mac Installer Distribution certificate for team $team" >&2; exit 1; }

./build.sh --universal
app=build/Fussbuddy.app
cp "$profile" "$app/Contents/embedded.provisionprofile"
# A downloaded profile carries the quarantine flag, which App Store uploads reject anywhere in the app.
xattr -cr "$app"

# The store build's entitlements: the app's own, plus the IDs the profile vouches for.
entitlements=build/store.entitlements
cp Fussbuddy.entitlements "$entitlements"
bundle=$(plutil -extract CFBundleIdentifier raw Info.plist)
plutil -insert com\\.apple\\.application-identifier -string "$team.$bundle" "$entitlements"
plutil -insert com\\.apple\\.developer\\.team-identifier -string "$team" "$entitlements"

codesign --force --sign "$app_id" --entitlements "$entitlements" "$app"
codesign --verify --strict "$app"
productbuild --component "$app" /Applications --sign "$installer_id" build/Fussbuddy.pkg
echo build/Fussbuddy.pkg
