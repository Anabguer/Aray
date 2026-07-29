from PIL import Image
from pathlib import Path

src = Path(
    r"C:\Users\agl03\.cursor\projects\w-Aray\assets\c__Users_agl03_AppData_Roaming_Cursor_User_workspaceStorage_d76a5ee68f391d406f16f4e153270a89_images_favicon-73b2c384-365a-44ba-90bc-0388fed15506-a7e26bf2-ffcf-4fc0-b315-0b9abf13316d.png"
)
public = Path(r"W:\Aray\public")
icons = public / "icons"
brand = public / "brand"
brand.mkdir(parents=True, exist_ok=True)
icons.mkdir(parents=True, exist_ok=True)

img = Image.open(src).convert("RGBA")
pixels = img.load()
w, h = img.size

for y in range(h):
    for x in range(w):
        r, g, b, a = pixels[x, y]
        if g > 140 and g > r + 40 and g > b + 40:
            excess = min(g - r, g - b)
            if excess > 90 and g > 180:
                pixels[x, y] = (r, g, b, 0)
            elif excess > 55:
                alpha = max(0, int(255 * (1 - (excess - 55) / 70)))
                pixels[x, y] = (r, g, b, min(a, alpha))

bbox = img.getbbox()
if bbox:
    pad = 24
    left = max(0, bbox[0] - pad)
    top = max(0, bbox[1] - pad)
    right = min(w, bbox[2] + pad)
    bottom = min(h, bbox[3] + pad)
    cropped = img.crop((left, top, right, bottom))
else:
    cropped = img

side = max(cropped.size)
square = Image.new("RGBA", (side, side), (0, 0, 0, 0))
ox = (side - cropped.size[0]) // 2
oy = (side - cropped.size[1]) // 2
square.paste(cropped, (ox, oy), cropped)

master = square.resize((1024, 1024), Image.Resampling.LANCZOS)
master.save(brand / "aray-favicon-source.png", optimize=True)

sizes = {
    public / "favicon.png": 32,
    public / "apple-touch-icon.png": 180,
    icons / "icon-16.png": 16,
    icons / "icon-32.png": 32,
    icons / "icon-48.png": 48,
    icons / "icon-72.png": 72,
    icons / "icon-96.png": 96,
    icons / "icon-128.png": 128,
    icons / "icon-144.png": 144,
    icons / "icon-192.png": 192,
    icons / "icon-256.png": 256,
    icons / "icon-512.png": 512,
}

for path, size in sizes.items():
    out = master.resize((size, size), Image.Resampling.LANCZOS)
    out.save(path, optimize=True)
    print(f"wrote {path.name} {size}x{size}")

print("done")
