"""Build review images from the exact shipped frames, not the source drawings.

The GIF samples published poses with rounded playback clocks. Contact sheets expose every facing
for every appearance so direction and proportion mistakes can be reviewed before
asking a visitor to inspect the live world. These files are documentation only.
"""
import json
from functools import lru_cache
from PIL import Image, ImageDraw, ImageFont
from BuildPeople import ROOT, APPEARANCES, GAIT

OUT = ROOT / 'docs'
sheets = json.loads((ROOT / 'src/world/SpriteSheets.json').read_text())
font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 13)
small = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 11)
BACKGROUND = '#173d35'


@lru_cache(maxsize=32)
def source_image(asset):
    return Image.open(ROOT / ('public' + sheets[asset]['src'])).convert('RGBA')


def frame(asset, direction, column):
    sheet = sheets[asset]
    image = source_image(asset)
    width, height = sheet['cw'], sheet['ch']
    return image.crop((column*width, direction*height, (column+1)*width, (direction+1)*height))


def preview_pose(asset, direction, column, size):
    """Match the runtime's solid base and smooth detail when a preview scales."""
    pose = frame(asset, direction, column)
    detail = pose.resize(size, Image.Resampling.LANCZOS)
    return Image.alpha_composite(pose.resize(size, Image.Resampling.NEAREST), detail) if sheets[asset].get('opaqueBody') else detail


def main():
    for action in ['walk', 'run']:
        review = Image.new('RGB', (1180, 55 + len(APPEARANCES)*150), BACKGROUND)
        draw = ImageDraw.Draw(review)
        draw.text((18, 16), action.title() + ' — actual published directions: S, SW, W, NW, N, NE, E, SE', font=font, fill='#e6efcf')
        for row, look in enumerate(APPEARANCES):
            asset = look['asset'] + ('-run' if action == 'run' else '')
            name = look['name']
            draw.text((12, row*150+112), name, font=small, fill='#c3d9c6')
            for direction in range(8):
                pose = frame(asset, direction, 0)
                review.paste(pose, (150+direction*128, 45+row*150), pose)
        review.save(OUT / ('Characters-' + action + '.png'), optimize=True)

    family = [look for look in APPEARANCES if look.get('default')]
    frames = []
    # Show a whole walk cycle, then a whole run cycle at the game's actual
    # cadence. Quantize boundary timestamps (not each duration independently)
    # so GIF's ten-ms clock preserves the correct total 1040/880-ms cycles.
    steps = []
    durations = []
    run_durations = []
    for active, action in enumerate(['walk', 'run']):
        count = sheets['masyn'+('-run' if action=='run' else '')]['cycleFrames']
        frame_ms = GAIT[action+'CycleMs']/count
        boundaries = [round(i*frame_ms/10)*10 for i in range(count+1)]
        for phase in range(count):
            steps.append((active, phase))
            durations.append(boundaries[phase+1]-boundaries[phase])
        if action == 'run':
            run_durations = [b-a for a,b in zip(boundaries, boundaries[1:])]
    running = []
    for active, phase in steps:
        image = Image.new('RGB', (960, 410), BACKGROUND)
        draw = ImageDraw.Draw(image)
        draw.text((22, 14), 'Walking, then running · game animation cadence', font=font, fill='#e6efcf')
        for row, action in enumerate(['walk', 'run']):
            for index, look in enumerate(family):
                asset = look['asset'] + ('-run' if row else '')
                sheet = sheets[asset]
                column = phase if row == active else sheet['idleFrame']
                pose = preview_pose(asset, 2 if row else 0, column, (160,180))
                image.paste(pose, (index*192+16, row*185+31), pose)
                draw.text((index*192+35,row*185+207),look['name'],font=font,fill='#c3d9c6')
        frames.append(image)
        if active == 1:
            run_frame = Image.new('RGB', (1152,220), BACKGROUND)
            run_draw = ImageDraw.Draw(run_frame)
            archer = next(look for look in APPEARANCES if look['asset'] == 'costume-skills')
            for index, look in enumerate(family + [archer]):
                pose = preview_pose(look['asset']+'-run', 2, phase, (160,180))
                run_frame.paste(pose, (index*192+16,5), pose)
                run_draw.text((index*192+30,190), look['name'], font=font, fill='#c3d9c6')
            running.append(run_frame)
    frames[0].save(OUT/'CharacterPreview.gif', save_all=True, append_images=frames[1:], duration=durations, loop=0, disposal=2, optimize=True)
    running[0].save(OUT/'RunningPreview.gif', save_all=True, append_images=running[1:], duration=run_durations, loop=0, disposal=2, optimize=True)
    # Focused wardrobe review uses the same exported poses and cadence as the
    # game. Ezra faces north to expose the specific silhouette correction.
    wardrobe = [('costume-resume', 'Wizard reference', 0),
                ('link', 'Hyrulian Adventurer', 2),
                ('costume-portfolio', 'Masyn: trainer', 2),
                ('ezra', 'Ezra: north', 4)]
    costume_frames = []
    costume_durations = []
    for facing in [0, 2]:
        for action in ['walk', 'run']:
            period = GAIT[action+'CycleMs']
            boundaries = [round(i*period/16/10)*10 for i in range(17)]
            for phase in range(16):
                image = Image.new('RGB', (960, 295), BACKGROUND)
                draw = ImageDraw.Draw(image)
                draw.text((15, 7), action.title()+' · '+('south' if facing==0 else 'west'), font=font, fill='#e6efcf')
                for index, (asset, label, _) in enumerate(wardrobe):
                    pose = preview_pose(asset+('-run' if action=='run' else ''), 4 if asset=='ezra' else facing, phase, (192,216))
                    image.paste(pose, (index*240+24,30), pose)
                    draw.text((index*240+20,267), label, font=font, fill='#c3d9c6')
                costume_frames.append(image)
                costume_durations.append(boundaries[phase+1]-boundaries[phase])
    costume_frames[0].save(OUT/'CostumePreview.gif', save_all=True,
        append_images=costume_frames[1:], duration=costume_durations, loop=0,
        disposal=2, optimize=True)
    # Review every front-facing frame, not just the first one. A rotating
    # turnaround inside a walk cycle is immediately visible in this contact sheet.
    contact = Image.new('RGB', (2048,1020), BACKGROUND)
    draw = ImageDraw.Draw(contact)
    for index, asset in enumerate(['costume-resume','link','costume-portfolio']):
        for offset, action in enumerate(['walk','run']):
            y = (index*2+offset)*170
            draw.text((8,y+4), asset+' · '+action+' · all sixteen south poses', font=font, fill='#e6efcf')
            for column in range(16):
                pose = frame(asset+('-run' if offset else ''),0,column)
                contact.paste(pose,(column*128,y+24),pose)
    contact.save(OUT/'CostumeFrames.png',optimize=True)
    print('Saved the character previews and both direction review sheets in docs/.')


if __name__ == '__main__':
    main()
