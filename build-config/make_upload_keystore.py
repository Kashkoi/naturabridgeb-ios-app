"""Create a Google Play UPLOAD keystore for an app and wire it into the Android project.

Usage: python build-config/make_upload_keystore.py <secrets_dir> <name>
Writes <secrets_dir>/<name>-upload-keystore.jks and a README beside it holding the password
(same convention as the existing keystone keystore), then android-app/android/keystore.properties
(gitignored). The password is never printed. Refuses to overwrite an existing keystore.
"""
import datetime
import io
import os
import secrets
import subprocess
import sys

secrets_dir, name = sys.argv[1], sys.argv[2]
ks = os.path.join(secrets_dir, f"{name}-upload-keystore.jks")
readme = os.path.join(secrets_dir, f"{name}-upload-keystore.README.txt")
if os.path.exists(ks):
    sys.exit(f"keystore already exists: {ks}")
pw = secrets.token_urlsafe(24)
subprocess.run([
    "keytool", "-genkeypair", "-v", "-keystore", ks, "-alias", "upload", "-keyalg", "RSA", "-keysize", "2048",
    "-validity", "10000", "-storepass", pw, "-keypass", pw,
    "-dname", "CN=Alpha Inception LLC, O=Alpha Inception LLC, C=US",
], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
io.open(readme, "w", encoding="utf-8", newline="\n").write(
    f"keystore: {os.path.basename(ks)}\nalias: upload\nstore/key password: {pw}\n"
    f"created: {datetime.date.today().isoformat()} (Google Play UPLOAD key for {name})\n"
    "Used by android-app/android/keystore.properties. If lost, Play Console > App integrity can reset the upload key.\n")
props = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "android-app", "android", "keystore.properties")
io.open(props, "w", encoding="utf-8", newline="\n").write(
    f"storeFile={ks.replace(os.sep, '/')}\nstorePassword={pw}\nkeyAlias=upload\nkeyPassword={pw}\n")
print("created", ks)
