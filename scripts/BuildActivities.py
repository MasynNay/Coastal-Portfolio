"""Pack complete, illustrated activity poses without altering people's anatomy.

Each source has two groups of five directions, eight poses per direction.
Bodies remain single drawings. Only the separately drawn bicycle/axolotl is
composited underneath; the game supplies boards, vehicles and one fishing rod.
The published origin and body scale match BuildPeople.py, so changing activity
does not change the wearer's size or silently replace their costume.
"""
import hashlib
import json
import statistics
import sys
from functools import lru_cache
from PIL import Image, ImageOps
import ImportSprites as sprites
from BuildPeople import ROOT, SOURCE, WIDTH, HEIGHT, FOOT, APPEARANCES, LOOKS, OPAQUE_LOOKS, read_poses

FRAMES = 8
GROUPS = {
    'skating': ['board-ride', 'board-trick'],
    'water': ['wake-ride', 'water-ride'],
    'exploring': ['bike', 'surf'],
    'fishing': ['fish', 'fish-surf'],
}
OWNERS = {entry['asset']: entry['character'] for entry in APPEARANCES}
MOUNT_COLORS = {'masyn': 0, 'mi-shell': 1, 'fitzgerald': 2, 'fallyn': 3, 'ezra': 4}
HEIGHTS = {entry['character']: entry['height'] for entry in APPEARANCES if entry.get('default')}
BIKE = json.loads((ROOT / 'src/world/BikeFit.json').read_text())
DIRECTIONS = json.loads((ROOT / 'docs/source-assets/DirectionRows.json').read_text())
POSE_HEIGHT = {
    'board-ride': 102, 'board-trick': 96, 'wake-ride': 94, 'water-ride': 88,
    'bike': 92, 'surf': 96, 'fish': 104, 'fish-surf': 96,
}


def head_width(image):
    """Compare head scale, not standing height against a bent, seated figure."""
    body = image.crop(image.getbbox())
    box = body.crop((0, 0, body.width, max(1, round(body.height * .29)))).getbbox()
    return box[2] - box[0]


def place(canvas, figure, center, height):
    scale = height / figure.height
    figure = figure.resize((round(figure.width * scale), round(height)), Image.Resampling.LANCZOS)
    canvas.alpha_composite(figure, (round(center[0] - figure.width / 2),
                                   round(center[1] - figure.height / 2)))


@lru_cache(maxsize=2)
def bicycle_image(src):
    """Decode each prop once instead of once for every rider and pedal pose."""
    return Image.open(ROOT / ('public' + src)).convert('RGBA')


def bicycle(manifest, action, view, frame):
    sheet = manifest[action]
    source = bicycle_image(sheet['src'])
    row = [0, 2, 2, 1, 1][view]
    column = frame % sheet['columns']
    cw, ch = sheet['cw'], sheet['ch']
    cell = source.crop((column*cw, row*ch, (column+1)*cw, (row+1)*ch))
    return cell.crop(cell.getbbox())


def build(names, available=False, only=None):
    manifest_file = ROOT / 'src/world/SpriteSheets.json'
    catalog_file = ROOT / 'docs/source-assets/People.json'
    manifest = json.loads(manifest_file.read_text())
    catalog = json.loads(catalog_file.read_text())
    mounts, _ = sprites.extract(SOURCE / 'Mounts.png', 5, 4)
    staged = []
    for name in names:
        reference_sheet = manifest[name]
        assert reference_sheet.get('drawn'), (name, 'publish the complete movement drawings first')
        reference = Image.open(ROOT / ('public' + reference_sheet['src'])).convert('RGBA')
        for group, actions in GROUPS.items():
            if only and not any(action in only for action in actions):
                continue
            path = SOURCE / name / (group + '.png')
            if available and not path.exists():
                print('Artwork still needed:', name, group, flush=True)
                continue
            cells = read_poses(path, [10], 8)
            for index, action in enumerate(actions):
                if only and action not in only:
                    continue
                # Board riding has its own complete planted-foot drawings. A
                # skating cycle is a balance, not a recycled walking stride.
                balance = SOURCE / name / 'balancing.png'
                dedicated = action == 'board-ride' and balance.exists()
                action_cells = read_poses(balance, [5], 8) if dedicated else cells[index*5*FRAMES:(index+1)*5*FRAMES]
                outputs = ['bike-acro', 'bike-mach'] if action == 'bike' else [action]
                for output in outputs:
                    asset = name + '-' + output
                    # Source views are visually checked. Explicit corrections
                    # handle a rear view that the illustrator faced the wrong
                    # way; exported left/right poses still share one drawing.
                    canonical = [[0,0],[1,0],[2,0],[3,0],[4,0],[3,1],[2,1],[1,1]]
                    directions = canonical if dedicated else DIRECTIONS.get(asset, canonical)
                    # A rental keeps its physical size under every family member.
                    # Larger source canvases provide room for children's full-size
                    # bicycles without enlarging their heads or clipping wheels.
                    mounted = action in ['surf', 'fish-surf']
                    width = BIKE['canvasWidth'] if action == 'bike' else 192 if mounted else WIDTH
                    height = BIKE['canvasHeight'] if action == 'bike' else 192 if mounted else HEIGHT
                    foot = BIKE['footY'] if action == 'bike' else 180 if mounted else FOOT
                    bike_size = BIKE['worldHeight'] * 96 / HEIGHTS[OWNERS[name]]
                    atlas = Image.new('RGBA', (width*(FRAMES+1), height*8))
                    soles = []
                    sole_anchors = []
                    for row in range(8):
                        view, flip = directions[row]
                        assert 0 <= view < 5, (asset, 'source direction outside the five-view group')
                        poses = action_cells[view*FRAMES:(view+1)*FRAMES]
                        standing = reference.crop((reference_sheet['idleFrame']*WIDTH, view*HEIGHT,
                                                  (reference_sheet['idleFrame']+1)*WIDTH, (view+1)*HEIGHT))
                        reference_head = statistics.median(head_width(reference.crop((reference_sheet['idleFrame']*WIDTH, v*HEIGHT, (reference_sheet['idleFrame']+1)*WIDTH, (v+1)*HEIGHT))) for v in range(5)) if mounted else head_width(standing)
                        scale = reference_head / statistics.median(head_width(cell) for cell in poses)
                        # Long hair can widen the reference head band, and a
                        # seated silhouette has less torso below that band.
                        # Cap one common scale for the WHOLE row; never stretch
                        # individual knees, or clip a larger pose at the border.
                        scale = min(scale, POSE_HEIGHT[action] / max(p.height for p in poses))
                        side_reach = []
                        for p in poses:
                            head = p.crop((0, 0, p.width, round(p.height*.29))).getbbox()
                            center = (head[0]+head[2])/2
                            side_reach.append(max(center, p.width-center))
                        scale = min(scale, (width/2-5) / max(side_reach))
                        for frame, figure in enumerate(poses + [poses[0]]):
                            cell = Image.new('RGBA', (width, height))
                            if action in ['surf', 'fish-surf']:
                                mount = mounts[MOUNT_COLORS[OWNERS[name]]*4+[0, 2, 2, 1, 1][view]]
                                # Front/rear mounts must retain a readable body and gills,
                                # rather than shrinking to the height of a side profile.
                                place(cell, mount, (width/2, foot-18), 56 if view in [0,3,4] else 38)
                            elif action == 'bike':
                                place(cell, bicycle(manifest, output, view, frame), (width/2, foot-bike_size/2), bike_size)
                            figure = figure.resize((round(figure.width*scale), round(figure.height*scale)), Image.Resampling.LANCZOS)
                            head = figure.crop((0, 0, figure.width, round(figure.height*.29))).getbbox()
                            anchor = (head[0]+head[2])/2
                            drop = 9 if action in ['surf', 'fish-surf', 'water-ride', 'bike'] else 2 if action in ['wake-ride', 'board-ride'] else 0
                            # Real bent-leg drawings retain their shorter silhouette;
                            # never stretch them to a standing figure's bounding box.
                            top = foot-96+drop
                            if action == 'bike':
                                top = round(foot-bike_size*BIKE['saddleHeight']-BIKE['riderHipY'])
                            cell.alpha_composite(figure, (round(width/2-anchor), top))
                            if flip:
                                cell = ImageOps.mirror(cell)
                            if dedicated:
                                # The native balance poses have bent knees and
                                # shorter side silhouettes. Register their soles,
                                # not the standing body's old fixed baseline.
                                bounds = cell.getbbox()
                                sole = bounds[3] - 1
                                feet = cell.crop((0, max(0, sole-7), width, sole+1)).getbbox()
                                soles.append(sole)
                                sole_anchors.append((feet[0]+feet[2])/2)
                            atlas.alpha_composite(cell, (frame*width, row*height))
                    alpha = atlas.getchannel('A').point(lambda a: 255 if a >= 160 else 0)
                    atlas = atlas.convert('RGB').quantize(colors=128, dither=Image.Dither.NONE).convert('RGBA')
                    atlas.putalpha(alpha)
                    destination = ROOT / 'public/world/sprites/emerald' / (asset+'.png')
                    temporary = destination.with_suffix('.new.png')
                    atlas.save(temporary, optimize=True)
                    staged.append((temporary, destination))
                    sheet = dict(id=asset, src='/world/sprites/emerald/'+asset+'.png',
                        cw=width, ch=height, rows=8, columns=FRAMES+1, cycleFrames=FRAMES,
                        idleFrame=FRAMES, bodyHeight=96, footY=foot, rootAligned=True,
                        mountHeight=(56 if mounted else None),
                        drawn=True, pixelArt=True, smooth=True, colors=128,
                        detailVersion=4, detailScale=96/36, layout='eight', canonicalDirections=True,
                        previewWidth=width, action='fish' if action.startswith('fish') else action,
                        frameMs=95 if action in ['board-ride', 'board-trick', 'fish', 'fish-surf'] else 80 if action=='bike' else 125,
                        anchors=[width/2-1 if flip else width/2 for view,flip in directions for _ in range(FRAMES+1)],
                        revision=hashlib.sha256(temporary.read_bytes()).hexdigest()[:12])
                    if dedicated:
                        sheet.update(baselines=soles, anchors=sole_anchors)
                    if action.startswith('fish'):
                        sheet.update(illustratedRod=False, holdFrame=FRAMES-1, mounted=action=='fish-surf')
                    if name in OPAQUE_LOOKS:
                        sheet['opaqueBody'] = True
                    if action == 'bike':
                        sheet.update(bikeHeight=bike_size, bikeWorldHeight=BIKE['worldHeight'],
                                     labelTop=round(foot-bike_size*BIKE['saddleHeight']-BIKE['riderHipY']))
                    manifest[asset] = sheet
                    catalog[asset] = dict(type='drawn', file='people/'+name+'/'+('balancing' if dedicated else group)+'.png', group=group, action=output)
            print('Packed full-body activities:', name, group, flush=True)
    for temporary, destination in staged:
        temporary.replace(destination)
    metadata = manifest_file.with_suffix('.json.new')
    metadata.write_text(json.dumps(manifest, indent=2)+'\n')
    metadata.replace(manifest_file)
    catalog_file.write_text(json.dumps(catalog, indent=2)+'\n')


if __name__ == '__main__':
    names = LOOKS if '--all' in sys.argv else [arg for arg in sys.argv[1:] if not arg.startswith('--')]
    assert names, 'Pass the character/costume names to publish.'
    only = next((set(arg.split('=',1)[1].split(',')) for arg in sys.argv[1:] if arg.startswith('--actions=')), None)
    build(names, '--available' in sys.argv, only)
