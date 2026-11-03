"""Draw anatomical pose diagrams for full-body sprite artwork.

These diagrams are art references, not runtime characters. An illustrator paints
complete poses over the guides; no detached-limb animation is shipped by them.
The fixed cell origins make direction and proportion checks possible at import.
"""

from pathlib import Path
import math
from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parents[1] / "docs/source-assets/people/guides"
OUT.mkdir(exist_ok=True)
CELL = 256
SCALE = 1.65


def joint(forward, down, upper, lower):
    distance = min(math.hypot(forward, down), upper + lower - 0.01)
    along = (upper * upper - lower * lower + distance * distance) / (2 * distance)
    bend = math.sqrt(max(0, upper * upper - along * along))
    magnitude = math.hypot(forward, down)
    return (
        forward / magnitude * along + down / magnitude * bend,
        down / magnitude * along - forward / magnitude * bend,
    )


def diagram(view, phase, action):
    canvas = Image.new("RGBA", (CELL, CELL))
    draw = ImageDraw.Draw(canvas)
    angle = view * math.pi / 4
    dx, dy = -math.sin(angle), math.cos(angle) * 0.23
    cross_x, cross_y = math.cos(angle), math.sin(angle) * 0.23
    running = action == "run"
    idle = action == "idle"
    lift = (
        (
            max(0, math.sin((phase - 0.31) * math.pi * 4)) * 3.5
            if running
            else (1 - math.cos(phase * math.pi * 4)) * 0.5
        )
        if not idle
        else 0
    )
    steps = []
    for side in [0, 1]:
        p = (phase + side * 0.5) % 1
        stance = 0.39 if running else 0.62
        reach = 13 if running else 7
        if idle:
            forward, raised = 0, 0
        elif p < stance:
            forward, raised = reach * (1 - 2 * p / stance), 0
        else:
            t = (p - stance) / (1 - stance)
            forward, raised = -reach * math.cos(t * math.pi), math.sin(t * math.pi) * (
                19 if running else 7
            )
        steps.append((forward, raised))
    # Pelvis height follows the planted leg's reach. This prevents a rising
    # torso from stretching a shin or lifting a supposedly grounded foot.
    hip_height = 33 if idle else 30 + lift if running else 33 + lift
    for forward, raised in steps:
        if raised < 0.01:
            hip_height = min(hip_height, math.sqrt(34 * 34 - forward * forward))
    lift = hip_height - 33
    lean = 2 if running else 0

    def point(x, y):
        return (CELL / 2 + (x - 64) * SCALE, 40 + (y - 40) * SCALE)

    def line(a, b, color, width):
        draw.line([point(*a), point(*b)], fill=color, width=round(width * SCALE))
        radius = width * SCALE / 2
        for x, y in [point(*a), point(*b)]:
            draw.ellipse((x - radius, y - radius, x + radius, y + radius), fill=color)

    def projected(origin, forward, down):
        return origin[0] + dx * forward, origin[1] + down + dy * forward

    for side in [0, 1]:
        forward, raised = steps[side]
        hip = (
            64 + (side * 2 - 1) * cross_x * 7,
            101 - lift + (side * 2 - 1) * cross_y * 7,
        )
        # A planted foot stays on the ground while the pelvis rises above it.
        down = 33 + lift - raised
        ku, kv = joint(forward, down, 17, 17)
        knee = projected(hip, ku, kv)
        foot = projected(hip, forward, down)
        color = "#6587c3" if side else "#e2a564"
        line(hip, knee, color, 10)
        line(knee, foot, color, 9)
        line((foot[0] - 3, foot[1]), (foot[0] + 3, foot[1]), "#36424c", 5)
    left, top = point(64 - 14, 72 - lift)
    right, bottom = point(64 + 14, 104 - lift)
    draw.rounded_rectangle((left, top, right, bottom), radius=8, fill="#a8bab0")
    for side in [0, 1]:
        shoulder = (
            64 + dx * lean + (side * 2 - 1) * cross_x * 15,
            76 - lift + (side * 2 - 1) * cross_y * 15,
        )
        # Opposite arm is back at foot contact. Sine put both hands forward at
        # contact; the cosine offset gives a real opposing arm/leg rhythm.
        swing = (
            0
            if idle
            else -math.cos((phase + side * 0.5) * math.pi * 2)
            * (1.1 if running else 0.3)
        )
        flex = swing + (1.45 if running else 0.1)
        u, v = math.sin(swing) * 13, math.cos(swing) * 13
        elbow = projected(shoulder, u, v)
        hand = projected(shoulder, u + math.sin(flex) * 12, v + math.cos(flex) * 12)
        line(shoulder, elbow, "#a98a9b", 7)
        line(elbow, hand, "#a98a9b", 6)
    x, y = point(64 + dx * lean, 55 - lift)
    rx, ry = 15 * SCALE, 16 * SCALE
    draw.ellipse((x - rx, y - ry, x + rx, y + ry), fill="#c3cbd4")
    if view in [0, 1]:
        for eye in [-5, 5]:
            xx, yy = point(64 + eye + dx * lean, 54 - lift)
            draw.ellipse((xx - 2, yy - 2, xx + 2, yy + 2), fill="#36424c")
    elif view == 2:
        xx, yy = point(53 + dx * lean, 54 - lift)
        draw.ellipse((xx - 2, yy - 2, xx + 2, yy + 2), fill="#36424c")
    return canvas


def main():
    for view, name in enumerate(["south", "southwest", "west", "northwest", "north"]):
        guide = Image.new("RGBA", (CELL * 4, CELL * 9))
        for cell in range(36):
            action = "idle" if cell < 4 else "walk" if cell < 20 else "run"
            phase = (
                (cell - (4 if action == "walk" else 20)) / 16 if action != "idle" else 0
            )
            guide.alpha_composite(
                diagram(view, phase, action), (cell % 4 * CELL, cell // 4 * CELL)
            )
        guide.save(OUT / (name + ".png"))
        guide.crop((0, CELL, CELL * 4, CELL * 5)).save(OUT / ("walk-" + name + ".png"))
    print("Saved five fixed-origin full-body pose guides.")


if __name__ == "__main__":
    main()
