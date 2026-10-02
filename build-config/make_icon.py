"""Draw the NaturaBridge app icon: a leaf whose upper half is a bridge (arch, deck, cables).

    python make_icon.py <variant> <out_dir>      variant: consumer | clinical | business

Writes into <out_dir>:
    icon-1024.png                 full-bleed square, no alpha (iOS App Store icon, master)
    icon-512.png                  same, 512 px
    icon.ico                      16-256 px, for Windows
    mark-1024.png                 the mark alone on transparency (splash screens)
    adaptive-foreground-1024.png  mark and badge inside the Android adaptive-icon safe zone
    mark-mono-432.png             white mark on transparency (Android themed icon)
    splash-2732.png               app background with the mark centred (iOS launch image)
    brand.json                    the colours other build scripts need

Everything is drawn from geometry at 4x and scaled down, so there is no source artwork to
lose: to change the icon, change this file and run it again. Needs Pillow.
"""
import json
import os
import sys

from PIL import Image, ImageChops, ImageDraw

SS = 4                      # supersampling factor
N = 1024 * SS               # working canvas

VARIANTS = {
    # bg: icon background, top / bottom.  mark: leaf colour, stem end / tip.
    # app_bg: the app's own background, used behind splash screens.
    "consumer": dict(bg=("#14558F", "#0B3256"), mark=("#B9F5CF", "#34D17A"), badge=None, app_bg="#0D3B66"),
    "clinical": dict(bg=("#12264A", "#081120"), mark=("#BFE8FF", "#4FACDE"), badge="cross", app_bg="#0A1628"),
    "business": dict(bg=("#1A2F47", "#0A1522"), mark=("#FFE2A6", "#F5A623"), badge="bars", app_bg="#050E1F"),
}


def rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def vgradient(size, top, bottom):
    """Vertical gradient image."""
    col = Image.new("RGB", (1, 256))
    col.putdata([tuple(round(top[c] + (bottom[c] - top[c]) * i / 255) for c in range(3)) for i in range(256)])
    return col.resize((size, size), Image.BILINEAR)


def hgradient(size, left, right):
    row = Image.new("RGB", (256, 1))
    row.putdata([tuple(round(left[c] + (right[c] - left[c]) * i / 255) for c in range(3)) for i in range(256)])
    return row.resize((size, size), Image.BILINEAR)


def leaf_mask(scale=1.0, angle=-32):
    """Greyscale mask of the mark, centred on an N x N canvas."""
    u = N * scale                    # one unit = icon width at scale 1
    cx = cy = N / 2
    a, b = 0.36 * u, 0.185 * u       # half-length and half-height of the leaf
    R = (a * a + b * b) / (2 * b)    # both edges are arcs of this radius
    off = R - b

    def disc(y0):
        m = Image.new("L", (N, N), 0)
        ImageDraw.Draw(m).ellipse([cx - R, y0 - R, cx + R, y0 + R], fill=255)
        return m

    # A leaf is the overlap of two discs.
    leaf = ImageChops.multiply(disc(cy + off), disc(cy - off))

    # Lower half stays solid. Upper half is hollowed out, leaving the arch, the deck and the cables.
    arch_t, deck_t, cable_t = 0.046 * u, 0.040 * u, 0.020 * u
    inner = Image.new("L", (N, N), 0)
    ImageDraw.Draw(inner).ellipse([cx - (R - arch_t), cy + off - (R - arch_t), cx + (R - arch_t), cy + off + (R - arch_t)], fill=255)
    hollow = Image.new("L", (N, N), 0)
    ImageDraw.Draw(hollow).rectangle([0, 0, N, cy - deck_t / 2], fill=255)
    hollow = ImageChops.multiply(hollow, inner)
    hollow = ImageChops.multiply(hollow, disc(cy - off))
    cables = ImageDraw.Draw(hollow)
    for k in (-2, -1, 0, 1, 2):
        x = cx + k * 0.105 * u
        cables.rectangle([x - cable_t / 2, 0, x + cable_t / 2, N], fill=0)
    mark = ImageChops.subtract(leaf, hollow)

    # A short stem at the lower-left tip makes it read as a leaf.
    stem_len, stem_t = 0.085 * u, 0.034 * u
    ImageDraw.Draw(mark).rounded_rectangle([cx - a - stem_len, cy - stem_t / 2, cx - a + 0.06 * u, cy + stem_t / 2],
                                           radius=stem_t / 2, fill=255)
    return mark.rotate(-angle, resample=Image.BICUBIC, center=(cx, cy))


def badge_layer(kind, bg_rgb, accent_rgb):
    """Small round badge, lower right."""
    layer = Image.new("RGBA", (N, N), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    r = 0.118 * N
    bx, by = 0.770 * N, 0.770 * N
    ring = 0.022 * N
    d.ellipse([bx - r - ring, by - r - ring, bx + r + ring, by + r + ring], fill=bg_rgb + (255,))
    d.ellipse([bx - r, by - r, bx + r, by + r], fill=(255, 255, 255, 255))
    g = accent_rgb + (255,)
    if kind == "cross":
        arm, t = 0.066 * N, 0.040 * N
        d.rounded_rectangle([bx - arm, by - t / 2, bx + arm, by + t / 2], radius=t * 0.18, fill=g)
        d.rounded_rectangle([bx - t / 2, by - arm, bx + t / 2, by + arm], radius=t * 0.18, fill=g)
    elif kind == "bars":
        w, gap, base = 0.034 * N, 0.016 * N, by + 0.058 * N
        heights = (0.050 * N, 0.084 * N, 0.118 * N)
        x0 = bx - (3 * w + 2 * gap) / 2
        for i, h in enumerate(heights):
            x = x0 + i * (w + gap)
            d.rounded_rectangle([x, base - h, x + w, base], radius=w * 0.2, fill=g)
    return layer


def down(img, size):
    return img.resize((size, size), Image.LANCZOS)


def build(variant, out_dir):
    v = VARIANTS[variant]
    os.makedirs(out_dir, exist_ok=True)
    bg_top, bg_bottom = rgb(v["bg"][0]), rgb(v["bg"][1])
    m0, m1 = rgb(v["mark"][0]), rgb(v["mark"][1])
    # The cross is blue, never red: a red cross on white is a protected emblem and app stores reject it.
    badge_accent = {"cross": rgb("#1C7FC0"), "bars": rgb("#C77F0A")}.get(v["badge"])

    def composed(scale, with_bg, badge=True, mono=False):
        mask = leaf_mask(scale * (0.94 if badge and v["badge"] else 1.0))
        if badge and v["badge"]:          # make room for the badge, lower right
            mask = ImageChops.offset(mask, round(-0.028 * N), round(-0.034 * N))
        fill = Image.new("RGB", (N, N), (255, 255, 255)) if mono else hgradient(N, m0, m1).rotate(32, resample=Image.BICUBIC)
        base = vgradient(N, bg_top, bg_bottom).convert("RGBA") if with_bg else Image.new("RGBA", (N, N), (0, 0, 0, 0))
        mark = fill.convert("RGBA")
        mark.putalpha(mask)
        base = Image.alpha_composite(base, mark)
        if badge and v["badge"]:
            base = Image.alpha_composite(base, badge_layer(v["badge"], bg_bottom, badge_accent))
        return base

    icon = composed(1.0, True).convert("RGB")
    down(icon, 1024).save(os.path.join(out_dir, "icon-1024.png"))
    down(icon, 512).save(os.path.join(out_dir, "icon-512.png"))
    down(icon, 256).save(os.path.join(out_dir, "icon.ico"), sizes=[(s, s) for s in (16, 24, 32, 48, 64, 128, 256)])

    down(composed(1.0, False, badge=False), 1024).save(os.path.join(out_dir, "mark-1024.png"))

    # Android adaptive icons show only the middle ~61% of the foreground for certain, so the
    # whole composition (mark and badge) is shrunk into that zone.
    def safe_zone(img, out):
        inner = round(out * 0.62)
        canvas = Image.new("RGBA", (out, out), (0, 0, 0, 0))
        small = down(img, inner)
        canvas.paste(small, ((out - inner) // 2, (out - inner) // 2), small)
        return canvas

    safe_zone(composed(1.0, False), 1024).save(os.path.join(out_dir, "adaptive-foreground-1024.png"))
    safe_zone(composed(1.0, False, badge=False, mono=True), 432).save(os.path.join(out_dir, "mark-mono-432.png"))

    app_bg = rgb(v["app_bg"])
    splash = Image.new("RGB", (2732, 2732), app_bg)
    mark = down(composed(1.0, False, badge=False), 1000)
    splash.paste(mark, ((2732 - 1000) // 2, (2732 - 1000) // 2), mark)
    splash.save(os.path.join(out_dir, "splash-2732.png"), optimize=True)

    mid = tuple((bg_top[c] + bg_bottom[c]) // 2 for c in range(3))
    with open(os.path.join(out_dir, "brand.json"), "w", encoding="utf-8", newline="\n") as f:
        json.dump({"variant": variant, "app_background": v["app_bg"].upper(),
                   "adaptive_icon_background": "#%02X%02X%02X" % mid}, f, indent=2)
        f.write("\n")
    print("wrote", variant, "->", out_dir)


if __name__ == "__main__":
    build(sys.argv[1], sys.argv[2])
