"""Brand the generated Capacitor Android project: launcher icons and splash from www/icon.png,
version, release signing from keystore.properties (not committed), and no cloud backup of app data.
Run from the repo root after `npx cap add android`:  python build-config/android_brand.py
"""
import io
import os
import re

from PIL import Image

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
RES = os.path.join(ROOT, "android-app", "android", "app", "src", "main", "res")
APP = os.path.join(ROOT, "android-app", "android", "app")
BG = (5, 14, 31, 255)           # #050E1F, the app background
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

icon = Image.open(os.path.join(ROOT, "www", "icon.png")).convert("RGBA")

# Launcher icons (legacy square + round) and adaptive foreground (icon inside the 66% safe zone).
for dpi, size in {"mdpi": 48, "hdpi": 72, "xhdpi": 96, "xxhdpi": 144, "xxxhdpi": 192}.items():
    d = os.path.join(RES, f"mipmap-{dpi}")
    base = Image.new("RGBA", (size, size), BG)
    inner = icon.resize((int(size * 0.82), int(size * 0.82)), Image.LANCZOS)
    base.alpha_composite(inner, ((size - inner.width) // 2, (size - inner.height) // 2))
    base.save(os.path.join(d, "ic_launcher.png"))
    base.save(os.path.join(d, "ic_launcher_round.png"))
    fg_size = int(size * 108 / 48)
    fg = Image.new("RGBA", (fg_size, fg_size), (0, 0, 0, 0))
    inner = icon.resize((int(fg_size * 0.56), int(fg_size * 0.56)), Image.LANCZOS)
    fg.alpha_composite(inner, ((fg_size - inner.width) // 2, (fg_size - inner.height) // 2))
    fg.save(os.path.join(d, "ic_launcher_foreground.png"))

# Adaptive icon background colour.
bg_xml = os.path.join(RES, "values", "ic_launcher_background.xml")
io.open(bg_xml, "w", encoding="utf-8", newline="\n").write(
    '<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#050E1F</color>\n</resources>\n')

# Splash screens: app background with the icon centred.
for sub in os.listdir(RES):
    p = os.path.join(RES, sub, "splash.png")
    if not os.path.exists(p):
        continue
    w, h = Image.open(p).size
    s = Image.new("RGBA", (w, h), BG)
    side = int(min(w, h) * 0.28)
    inner = icon.resize((side, side), Image.LANCZOS)
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
                  '<item name="android:background">@null</item>\n        <item name="android:windowBackground">@color/ic_launcher_background</item>')
    io.open(st, "w", encoding="utf-8", newline="\n").write(t)
print("android project branded: version", VERSION_NAME, "code", VERSION_CODE)
