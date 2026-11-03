"""Isolate complete silhouettes without importing pieces of neighboring frames."""

from PIL import Image, ImageFilter


def components(image):
    """Return opaque pixel islands and their source-space bounds (4-neighbor)."""
    w, h = image.size
    mask = bytearray(
        image.getchannel("A").point(lambda a: 255 if a >= 160 else 0).tobytes()
    )
    found = []
    for start in range(w * h):
        if not mask[start]:
            continue
        mask[start] = 0
        todo, pixels = [start], []
        left = right = start % w
        top = bottom = start // w
        while todo:
            p = todo.pop()
            x, y = p % w, p // w
            pixels.append(p)
            left, right = min(left, x), max(right, x)
            top, bottom = min(top, y), max(bottom, y)
            for q in (p - w, p + w, p - 1 if x else -1, p + 1 if x < w - 1 else -1):
                if 0 <= q < w * h and mask[q]:
                    mask[q] = 0
                    todo.append(q)
        found.append((pixels, (left, top, right + 1, bottom + 1)))
    return found


def extract_figures(image, rows, columns):
    """Pack whole figures when wings/tails overlap the source's implied grid.

    Bounding boxes may overlap, but each extracted image contains only its own
    silhouette. Tiny detached source flecks cannot leak into adjacent frames.
    A count mismatch stops the import rather than publishing a broken atlas.
    """
    image = image.convert("RGBA")
    figures = [c for c in components(image) if len(c[0]) > 300]
    if len(figures) != rows * columns:
        raise ValueError(f"Expected {rows * columns} figures, found {len(figures)}")
    figures.sort(key=lambda c: (c[1][1] + c[1][3]) / 2)
    ordered = []
    for row in range(rows):
        ordered.extend(
            sorted(
                figures[row * columns : (row + 1) * columns],
                key=lambda c: (c[1][0] + c[1][2]) / 2,
            )
        )
    cells, boxes = [], []
    for pixels, box in ordered:
        l, t, r, b = box
        alpha = bytearray((r - l) * (b - t))
        for p in pixels:
            y, x = divmod(p, image.width)
            alpha[(y - t) * (r - l) + x - l] = 255
        cell = image.crop(box)
        cell.putalpha(Image.frombytes("L", cell.size, bytes(alpha)))
        cells.append(cell)
        boxes.append(box)
    return cells, boxes


def clean_cutout(image):
    """Keep a body and nearby toes/whiskers; remove distant frame debris."""
    image = image.convert("RGBA")
    w, h = image.size
    found = components(image)
    if not found:
        return image
    biggest = max(found, key=lambda c: len(c[0]))
    body_mask = bytearray(w * h)
    for p in biggest[0]:
        body_mask[p] = 255
    nearby = (
        Image.frombytes("L", (w, h), bytes(body_mask))
        .filter(ImageFilter.MaxFilter(9))
        .tobytes()
    )
    alpha = bytearray(w * h)
    for pixels, _ in found:
        if pixels is biggest[0] or (len(pixels) > 3 and any(nearby[p] for p in pixels)):
            for p in pixels:
                alpha[p] = 255
    image.putalpha(Image.frombytes("L", (w, h), bytes(alpha)))
    return image.crop(image.getbbox())
