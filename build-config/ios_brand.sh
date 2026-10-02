#!/usr/bin/env bash
# Brand the iOS project that `npx cap add ios` generates in CI: app icon, launch image and
# minimum iOS version. Run from the repo root after `cap add ios` and before `pod install`:
#
#     bash build-config/ios_brand.sh [path to the generated App directory, default ios/App]
#
# The images come from build-config/brand/ (written by build-config/make_icon.py).
set -euo pipefail

IOS_MIN="15.0"          # Apple refuses uploads that target anything lower from April 2027
APP="${1:-ios/App}"
BRAND="$(cd "$(dirname "$0")" && pwd)/brand"
ASSETS="$APP/App/Assets.xcassets"

# App icon: the template holds a single 1024 px image and Xcode derives every other size.
cp "$BRAND/icon-1024.png" "$ASSETS/AppIcon.appiconset/AppIcon-512@2x.png"

# Launch image: the template has three copies of one picture (1x, 2x, 3x).
for f in "$ASSETS"/Splash.imageset/*.png; do
  cp "$BRAND/splash-2732.png" "$f"
done

# Minimum iOS version, in the Xcode project and in the Podfile.
perl -pi -e "s/IPHONEOS_DEPLOYMENT_TARGET = [0-9.]+;/IPHONEOS_DEPLOYMENT_TARGET = $IOS_MIN;/g" "$APP/App.xcodeproj/project.pbxproj"
perl -pi -e "s/^platform :ios, '[0-9.]+'/platform :ios, '$IOS_MIN'/" "$APP/Podfile"

# Fail the build here rather than ship the template's defaults.
if grep "IPHONEOS_DEPLOYMENT_TARGET" "$APP/App.xcodeproj/project.pbxproj" | grep -qv "= $IOS_MIN;"; then
  echo "ios_brand: a deployment target other than $IOS_MIN is still in the Xcode project" >&2; exit 1
fi
grep -q "^platform :ios, '$IOS_MIN'" "$APP/Podfile" || { echo "ios_brand: Podfile platform was not updated" >&2; exit 1; }
cmp -s "$BRAND/icon-1024.png" "$ASSETS/AppIcon.appiconset/AppIcon-512@2x.png" || { echo "ios_brand: app icon was not replaced" >&2; exit 1; }
echo "ios project branded: icon, launch image, iOS $IOS_MIN minimum"
