#!/usr/bin/env python3
"""Compile verified reference pixels into compact, colored ASCII cell maps.

Usage: python3 scripts/BuildAsciiArt.py --cache /path/to/reference/downloads
The app ships only the derived text/palette data; it does not fetch these sites
at runtime. Pillow is the same image-reading dependency used by sprite tools.
Source URLs, rights holders and checksums live in CharacterSources.json.
"""
import argparse
import hashlib
import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
TOKENS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+/'

def compile_character(path):
    source = Image.open(path)
    count = min(8, getattr(source, 'n_frames', 1))
    selected = [i * getattr(source, 'n_frames', 1) // count for i in range(count)]
    frames, durations, bounds = [], [], []
    all_frames, all_delays = [], []
    for i in range(getattr(source, 'n_frames', 1)):
        source.seek(i)
        all_frames.append(source.convert('RGBA').copy())
        all_delays.append(max(20, source.info.get('duration', 140)))
    for i, index in enumerate(selected):
        frame = all_frames[index]
        frames.append(frame)
        bounds.append(frame.getchannel('A').getbbox())
        end = selected[i + 1] if i + 1 < count else len(all_frames)
        durations.append(sum(all_delays[index:end]))
    union = (min(b[0] for b in bounds), min(b[1] for b in bounds),
             max(b[2] for b in bounds), max(b[3] for b in bounds))
    height = 64
    width = max(8, round(height * (union[2] - union[0]) / (union[3] - union[1]) * 1.55))
    samples = [f.crop(union).resize((width, height), Image.Resampling.LANCZOS) for f in frames]
    # One shared palette across a full loop prevents color changes between poses.
    montage = Image.new('RGB', (width, height * count))
    for i, frame in enumerate(samples):
        montage.paste(frame, (0, i * height), frame.getchannel('A'))
    quantized = montage.quantize(colors=64, method=Image.Quantize.MEDIANCUT)
    rgb = quantized.getpalette()[:192]
    palette = [rgb[i:i + 3] for i in range(0, len(rgb), 3)]
    cells = []
    for i, frame in enumerate(samples):
        alpha = frame.getchannel('A')
        rows = []
        for y in range(height):
            rows.append(''.join(TOKENS[quantized.getpixel((x, y + i * height))]
                                if alpha.getpixel((x, y)) >= 100 else ' '
                                for x in range(width)).rstrip())
        cells.append(rows)
    return {'width': width, 'height': height, 'palette': palette,
            'durations': durations, 'frames': cells}

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--cache', type=Path, required=True)
    args = parser.parse_args()
    sources = json.loads((ROOT / 'src/ascii/CharacterSources.json').read_text())
    output = {}
    for item in sources:
        path = args.cache / item['file']
        if hashlib.sha256(path.read_bytes()).hexdigest() != item['sha256']:
            raise ValueError(f"Reference changed: {item['id']}; review it before rebuilding.")
        output[item['id']] = compile_character(path)
    target = ROOT / 'src/ascii/CharacterFrames.json'
    target.write_text(json.dumps(output, separators=(',', ':')) + '\n')
    print(f"Compiled {len(output)} characters and {sum(len(c['frames']) for c in output.values())} poses.")

if __name__ == '__main__':
    main()
