"""Draw pose diagrams for the illustrator, not figures used in the game.

Each sheet has two activities, five directions per activity and eight poses per
row. BuildActivities.py consumes the finished full-body drawings in this layout.
Guide colors label limbs; they are never exported as a character's clothing.
"""
import math
from PIL import Image, ImageDraw
from PoseGuide import joint, CELL, SCALE, OUT
from BuildActivities import GROUPS


def activity(view, phase, action):
    canvas = Image.new('RGBA', (CELL, CELL))
    draw = ImageDraw.Draw(canvas)
    angle = view * math.pi / 4
    dx, dy = -math.sin(angle), math.cos(angle) * .23
    cross_x, cross_y = math.cos(angle), math.sin(angle) * .23
    wave = math.sin(phase * math.pi * 2)
    seated = action in ['bike', 'surf', 'water-ride', 'fish-surf']
    boarding = action in ['board-ride', 'board-trick', 'wake-ride']
    if seated:
        drop = 9
    elif action == 'board-trick':
        drop = 3 + max(0, wave) * 5
    else:
        drop = 3 if boarding else 0
    head = (64 + dx * (2 if boarding else 0), 55 + drop)
    hip_y = 101 + drop

    def point(x, y):
        return CELL / 2 + (x - 64) * SCALE, 40 + (y - 40) * SCALE

    def line(start, end, color, width):
        start, end = point(*start), point(*end)
        draw.line([start, end], fill=color, width=round(width * SCALE))
        radius = width * SCALE / 2
        for x, y in [start, end]:
            draw.ellipse((x-radius, y-radius, x+radius, y+radius), fill=color)

    def project(origin, forward, down):
        return origin[0] + dx * forward, origin[1] + down + dy * forward

    # Keep substantial thighs/calves and use reachable knee bends rather than
    # shortening a standing leg texture to make someone sit.
    for side in [0, 1]:
        p = phase + side * .5
        origin = (64 + (side * 2 - 1) * cross_x * 7,
                  hip_y + (side * 2 - 1) * cross_y * 7)
        if action == 'bike':
            forward = 9 + math.sin(p * math.pi * 2) * 7
            down = 18 + math.cos(p * math.pi * 2) * 5
        elif seated:
            forward, down = 14, 17
        elif action == 'board-ride' and side == 1:
            forward = -max(0, wave) * 15
            down = 31 - drop - max(0, -wave) * 6
        elif boarding:
            forward, down = (side * 2 - 1) * 6, 33 - drop
        else:
            forward, down = 0, 33
        knee_forward, knee_down = joint(forward, down, 17, 17)
        knee = project(origin, knee_forward, knee_down)
        foot = project(origin, forward, down)
        color = '#6587c3' if side else '#e2a564'
        line(origin, knee, color, 10)
        line(knee, foot, color, 9)
        line((foot[0]-3, foot[1]), (foot[0]+3, foot[1]), '#36424c', 5)

    left, top = point(50, 72 + drop)
    right, bottom = point(78, 104 + drop)
    draw.rounded_rectangle((left, top, right, bottom), radius=8, fill='#a8bab0')
    for side in [0, 1]:
        origin = (64 + (side * 2 - 1) * cross_x * 15,
                  76 + drop + (side * 2 - 1) * cross_y * 15)
        if action == 'wake-ride':
            forward, down = 19, 12
        elif action in ['bike', 'water-ride']:
            forward, down = 17, 16
        elif action.startswith('fish'):
            forward, down = 15 + max(0, wave) * 4, 8 - max(0, wave) * 8
        elif action == 'surf':
            forward, down = 8, 22
        else:
            forward, down = (-5 if side == 1 else 4) + wave * 3, 18
        # Elbows bend down/back: the other branch of the knee joint solution.
        distance = max(.1, math.hypot(forward, down))
        reach = min(distance, 25.9)
        along = reach / 2
        bend = math.sqrt(max(0, 13 * 13 - along * along))
        elbow_forward = forward / distance * along - down / distance * bend
        elbow_down = down / distance * along + forward / distance * bend
        elbow = project(origin, elbow_forward, elbow_down)
        hand = project(origin, forward, down)
        line(origin, elbow, '#a98a9b', 7)
        line(elbow, hand, '#a98a9b', 6)

    x, y = point(*head)
    rx, ry = 15 * SCALE, 16 * SCALE
    draw.ellipse((x-rx, y-ry, x+rx, y+ry), fill='#c3cbd4')
    if view in [0, 1]:
        for eye in [-5, 5]:
            x, y = point(head[0] + eye, head[1] - 1)
            draw.ellipse((x-2, y-2, x+2, y+2), fill='#36424c')
    elif view == 2:
        x, y = point(head[0] - 11, head[1] - 1)
        draw.ellipse((x-2, y-2, x+2, y+2), fill='#36424c')
    return canvas


def main():
    for name, pair in GROUPS.items():
        sheet = Image.new('RGBA', (CELL * 8, CELL * 10))
        for row in range(10):
            for column in range(8):
                sheet.alpha_composite(activity(row % 5, column / 8, pair[row // 5]),
                                      (column * CELL, row * CELL))
        sheet.save(OUT / (name + '.png'))
    print('Saved four paired full-body activity pose guides.')


if __name__ == '__main__':
    main()
