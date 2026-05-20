#!/usr/bin/env python3
"""
Normalise app icons for store submission.

Apple App Store rejects the 1024×1024 marketing icon if it has an alpha
channel or is in palette ("P") mode. Splash images also need to be flat
RGB. Android adaptive icon foreground, in contrast, MUST keep transparency
so the OS can mask it into circles/squircles.

Usage: python3 scripts/fix-icons.py
"""
from PIL import Image
from pathlib import Path

ASSETS = Path(__file__).resolve().parent.parent / "assets"

# (filename, target_mode, flatten_bg_or_None)
JOBS = [
    # Marketing icon — Apple requires RGB, no alpha
    ("icon.png",          "RGB",  (255, 255, 255)),
    # Splash icon — flatten onto splash backgroundColor (white in app.json)
    ("splash-icon.png",   "RGB",  (255, 255, 255)),
    # Android adaptive icon foreground — KEEP transparency
    ("adaptive-icon.png", "RGBA", None),
]


def fix(name: str, target_mode: str, flatten_bg):
    path = ASSETS / name
    img = Image.open(path)
    print(f"{name}: {img.size} {img.mode} -> ", end="")

    if target_mode == "RGB":
        rgba = img.convert("RGBA")
        canvas = Image.new("RGB", rgba.size, flatten_bg)
        canvas.paste(rgba, mask=rgba.split()[3])
        canvas.save(path, "PNG", optimize=True)
    else:
        img.convert(target_mode).save(path, "PNG", optimize=True)

    print(Image.open(path).mode)


if __name__ == "__main__":
    for job in JOBS:
        fix(*job)
    print("Done.")
