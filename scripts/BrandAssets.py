"""Export the approved transparent logo to web and browser-icon sizes.

This only fits/resizes the existing artwork and packs icons. Edit the source
artwork separately; every presentation consumes the same web export.
"""
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'docs/source-assets/brand/MNLogo.png'
PUBLIC = ROOT / 'public'
OUTPUT = PUBLIC / 'brand'
BACKGROUND = '#122c2e'


def fitted(art, size, padding=0, background=None):
    """Contain the whole mark, never stretch or crop its pointed petals."""
    canvas = Image.new('RGBA', size, background or (0, 0, 0, 0))
    drawing = art.copy()
    drawing.thumbnail((size[0] - padding * 2, size[1] - padding * 2), Image.Resampling.LANCZOS)
    canvas.alpha_composite(drawing, ((size[0] - drawing.width) // 2, (size[1] - drawing.height) // 2))
    return canvas


def favicons(source):
    """Use the original approved MN lotus, tightly framed at the browser tab size.

    Each PNG is sampled directly from the detailed cutout at its display size,
    avoiding the blur of reducing an already-small icon a second time.
    """
    alpha = source.getchannel('A')
    bounds = alpha.point(lambda a: 255 if a > 96 else 0).getbbox()
    art = source.crop(bounds)
    sizes = (16, 24, 32, 48, 64, 128, 256)
    images = [fitted(art, (size, size)) for size in sizes]
    images[-1].save(PUBLIC / 'favicon.ico', format='ICO', sizes=[(size, size) for size in sizes], append_images=images[:-1])
    for size, image in zip(sizes, images):
        if size in (16, 32, 48, 64, 128):
            image.save(OUTPUT / f'Favicon-{size}.png', optimize=True)


def main():
    OUTPUT.mkdir(exist_ok=True)
    source = Image.open(SOURCE).convert('RGBA')
    alpha = source.getchannel('A')
    assert alpha.getextrema() == (0, 255), 'The approved source must contain actual transparency.'
    # Ignore almost invisible glow when measuring the useful frame. Extra
    # padding retains that glow and every pointed edge in the exported mark.
    left, top, right, bottom = alpha.point(lambda a: 255 if a > 24 else 0).getbbox()
    art = source.crop((max(0, left - 24), max(0, top - 24), min(source.width, right + 24), min(source.height, bottom + 24)))
    master = fitted(art, (1024, 768), padding=24)
    master.save(OUTPUT / 'MNLogo.png', optimize=True)
    master.save(OUTPUT / 'MNLogo.webp', quality=92, method=6)
    for width in (256, 512):
        small = master.resize((width, width * 3 // 4), Image.Resampling.LANCZOS)
        small.save(OUTPUT / f'MNLogo-{width}.webp', quality=92, method=6)
    # A solid dark field gives the mint mark contrast on any operating-system
    # theme. Generous padding also keeps it inside a maskable app icon's safe area.
    for size in (192, 512):
        icon = fitted(art, (size, size), padding=round(size * .15), background=BACKGROUND)
        icon.convert('RGB').save(OUTPUT / f'Icon-{size}.png', optimize=True)
    favicons(source)
    # Static contrast/size review for the website, game plaque and Mac screen.
    proof = Image.new('RGB', (1080, 410), '#11252b')
    draw = ImageDraw.Draw(proof)
    for x, label, color in [(0, 'Dark website', '#101c22'), (360, 'Light layout', '#edf0e8'), (720, 'Game scenery', '#86b067')]:
        draw.rectangle((x, 0, x + 360, 410), fill=color)
        dark = x > 0
        tile = fitted(art, (316, 237), padding=12, background=BACKGROUND if dark else None)
        proof.paste(tile, (x + 22, 52), tile)
        draw.text((x + 22, 25), label, fill='#7e9f97')
        small = fitted(art, (80, 60), background=BACKGROUND if dark else None)
        proof.paste(small, (x + 22, 320), small)
        draw.text((x + 120, 344), 'Navigation size', fill='#7e9f97')
    proof.save(ROOT / 'docs/BrandReview.png', optimize=True)
    print('Exported transparent logo, favicon, app icons and docs/BrandReview.png.')


if __name__ == '__main__':
    main()
