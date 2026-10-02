"""Brand the generated Capacitor Android project: launcher icons and splash from build-config/brand/,
version, release signing from keystore.properties (not committed), and no cloud backup of app data.
Run from the repo root after `npx cap add android`:  python build-config/android_brand.py
"""
import io
import json
import os
import re

from PIL import Image, ImageDraw

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
RES = os.path.join(ROOT, "android-app", "android", "app", "src", "main", "res")
APP = os.path.join(ROOT, "android-app", "android", "app")
BRAND = os.path.join(ROOT, "build-config", "brand")      # written by build-config/make_icon.py
with open(os.path.join(BRAND, "brand.json"), encoding="utf-8") as _f:
    COLOURS = json.load(_f)
BG = tuple(int(COLOURS["app_background"][i:i + 2], 16) for i in (1, 3, 5)) + (255,)
VERSION_NAME = "1.1.0"
VERSION_CODE = 1

GRADLE_HEADER = """// CI passes -PversionCodeOverride=<build number>; local builds use the default.
def nbVersionCode = (project.findProperty('versionCodeOverride') ?: '%d').toInteger()

// Release signing reads android-app/android/keystore.properties (never committed):
//   storeFile=<absolute path to the upload keystore>, storePassword, keyAlias, keyPassword
def keystoreProps = new Properties()
def keystorePropsFile = rootProject.file("keystore.properties")
if (keystorePropsFile.exists()) { keystorePropsFile.withInputStream { keystoreProps.load(it) } }

android {
    signingConfigs {
        release {
            if (keystorePropsFile.exists()) {
                storeFile file(keystoreProps['storeFile'])
                storePassword keystoreProps['storePassword']
                keyAlias keystoreProps['keyAlias']
                keyPassword keystoreProps['keyPassword']
            }
        }
    }
"""

icon = Image.open(os.path.join(BRAND, "icon-1024.png")).convert("RGBA")
foreground = Image.open(os.path.join(BRAND, "adaptive-foreground-1024.png")).convert("RGBA")
mark = Image.open(os.path.join(BRAND, "mark-1024.png")).convert("RGBA")


def masked(img, size, radius):
    """Resize to size x size and round the corners (radius = size / 2 gives a circle)."""
    big = size * 4
    m = Image.new("L", (big, big), 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, big - 1, big - 1], radius=radius * 4, fill=255)
    out = img.resize((size, size), Image.LANCZOS)
    out.putalpha(m.resize((size, size), Image.LANCZOS))
    return out


# Launcher icons: legacy square and round for Android 7 and older, adaptive foreground for the rest.
for dpi, size in {"mdpi": 48, "hdpi": 72, "xhdpi": 96, "xxhdpi": 144, "xxxhdpi": 192}.items():
    d = os.path.join(RES, f"mipmap-{dpi}")
    masked(icon, size, round(size * 0.2)).save(os.path.join(d, "ic_launcher.png"))
    masked(icon, size, size // 2).save(os.path.join(d, "ic_launcher_round.png"))
    fg_size = int(size * 108 / 48)
    foreground.resize((fg_size, fg_size), Image.LANCZOS).save(os.path.join(d, "ic_launcher_foreground.png"))

# Colours: the adaptive icon's background, and the app background shown while the web view loads.
bg_xml = os.path.join(RES, "values", "ic_launcher_background.xml")
io.open(bg_xml, "w", encoding="utf-8", newline="\n").write(
    '<?xml version="1.0" encoding="utf-8"?>\n<resources>\n'
    f'    <color name="ic_launcher_background">{COLOURS["adaptive_icon_background"]}</color>\n'
    f'    <color name="nb_app_background">{COLOURS["app_background"]}</color>\n</resources>\n')

# Splash screens: app background with the mark centred.
for sub in os.listdir(RES):
    p = os.path.join(RES, sub, "splash.png")
    if not os.path.exists(p):
        continue
    w, h = Image.open(p).size
    s = Image.new("RGBA", (w, h), BG)
    side = int(min(w, h) * 0.42)
    inner = mark.resize((side, side), Image.LANCZOS)
    s.alpha_composite(inner, ((w - side) // 2, (h - side) // 2))
    s.convert("RGB").save(p)

# build.gradle: version and release signing.
g = os.path.join(APP, "build.gradle")
s = io.open(g, encoding="utf-8").read()
s = re.sub(r'versionName "[^"]+"', f'versionName "{VERSION_NAME}"', s)
if "keystore.properties" not in s:
    s = re.sub(r"versionCode \d+", "versionCode nbVersionCode", s)
    s = s.replace("android {\n", GRADLE_HEADER % VERSION_CODE, 1)
    s = s.replace("        release {\n            minifyEnabled false",
                  "        release {\n            if (keystorePropsFile.exists()) { signingConfig signingConfigs.release }\n"
                  "            minifyEnabled false", 1)
io.open(g, "w", encoding="utf-8", newline="\n").write(s)

# Manifest: keep session tokens and cached reports out of device/cloud backups.
m = os.path.join(APP, "src", "main", "AndroidManifest.xml")
x = io.open(m, encoding="utf-8").read().replace('android:allowBackup="true"', 'android:allowBackup="false"')
io.open(m, "w", encoding="utf-8", newline="\n").write(x)

# Window background to match the app while the web view loads.
st = os.path.join(RES, "values", "styles.xml")
t = io.open(st, encoding="utf-8").read()
if "android:windowBackground" not in t:
    t = t.replace('<item name="android:background">@null</item>',
                  '<item name="android:background">@null</item>\n        <item name="android:windowBackground">@color/nb_app_background</item>')
t = t.replace('<item name="android:windowBackground">@color/ic_launcher_background</item>',
              '<item name="android:windowBackground">@color/nb_app_background</item>')
io.open(st, "w", encoding="utf-8", newline="\n").write(t)
print("android project branded: version", VERSION_NAME, "code", VERSION_CODE)
