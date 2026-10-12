#!/usr/bin/env python3
"""Deterministic pixel export of the preserved image_gen sources.

Usage: python client/tools/process_lang_que_art.py --processor /path/to/generate2dsprite.py
The skill processor handles keying/extraction/alignment/QC. Its resize is
overridden in a subprocess for nearest pixel sampling; installed skills stay intact.
"""
import argparse
import json
from pathlib import Path
import runpy
import subprocess
import sys
import tempfile
from PIL import Image, ImageFilter


def worker():
    processor = sys.argv[2]
    args = sys.argv[3:]
    original_resize = Image.Image.resize

    def pixel_resize(self, size, resample=None, box=None, reducing_gap=None):
        return original_resize(self, size, resample=Image.Resampling.NEAREST, box=box)

    Image.Image.resize = pixel_resize
    sys.argv = [processor] + args
    runpy.run_path(processor, run_name='__main__')


def binary(image):
    image = image.convert('RGBA')
    # Magenta antialiasing can leave purple matte pixels next to transparent
    # holes (chair slats, aerial roots). Remove only edge-connected spill;
    # retain intentional interior cool shadows and original source files.
    pixels = image.load()
    outside = image.getchannel('A').point(lambda a: 255 if a < 128 else 0)
    spill = []
    for y in range(image.height):
        for x in range(image.width):
            r, g, b, a = pixels[x, y]
            if a >= 128 and r > g * 1.35 + 12 and b > g * 1.25 + 12:
                spill.append((x, y))
    for _ in range(3):
        adjacent = outside.filter(ImageFilter.MaxFilter(3))
        remaining = []
        for x, y in spill:
            if adjacent.getpixel((x, y)):
                pixels[x, y] = (0, 0, 0, 0)
                outside.putpixel((x, y), 255)
            else:
                remaining.append((x, y))
        spill = remaining
    image.putalpha(image.getchannel('A').point(lambda a: 255 if a >= 128 else 0))
    return image


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--processor', type=Path, required=True)
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1] / 'assets/world/lang_que'
    manifest = dict(generator='built-in image_gen', native_render_scale=2, filter='nearest',
                    resampling='nearest at every processing resize', alpha='binary; threshold 128; edge-connected magenta spill removed',
                    source_camera='orthographic top-down 3/4', assets={})

    with tempfile.TemporaryDirectory(prefix='lang-que-pixel-export-') as scratch_name:
        scratch = Path(scratch_name)

        def process(raw, name, rows, cols, cell, fit, target='asset', mode='single_asset'):
            out = scratch / name
            command = [sys.executable, __file__, '__worker__', str(args.processor), 'process',
                       '--input', str(raw), '--target', target, '--mode', mode,
                       '--rows', str(rows), '--cols', str(cols), '--cell-size', str(cell),
                       '--single-size', str(cell), '--fit-scale', str(fit), '--align', 'feet',
                       '--shared-scale', '--component-mode', 'all', '--strict-qc', '--output-dir', str(out)]
            subprocess.run(command, check=True, stdout=subprocess.DEVNULL)
            return out

        items = [
            ('house_tile', 'buildings', [0, 0, 768, 512], 128, None),
            ('house_tin', 'buildings', [768, 0, 1536, 512], 128, None),
            ('tea_cafe', 'buildings', [0, 512, 864, 1024], 168, None),
            ('pump_station', 'buildings', [864, 512, 1536, 1024], 96, None),
            ('banyan', 'banyan', None, 160, None),
            ('power_pole', 'power_pole', None, None, 144),
            ('market_stall', 'market_stall', None, 96, None),
            ('greenhouse', 'greenhouse', None, 160, None),
        ]
        for name, source, rect, width, height in items:
            raw = Image.open(root / 'source' / f'{source}.png')
            if rect:
                raw = raw.crop(rect)
            raw_path = scratch / f'{name}-raw.png'
            raw.save(raw_path)
            out = process(raw_path, name, 1, 1, 256, .85)
            image = binary(Image.open(out / 'sheet-transparent.png'))
            image = image.crop(image.getbbox())
            if width:
                height = round(image.height * width / image.width)
            else:
                width = round(image.width * height / image.height)
            image = binary(image.resize((width, height), Image.Resampling.NEAREST))
            image.save(root / f'{name}.png')
            manifest['assets'][name] = dict(source=f'source/{source}.png', source_crop=rect,
                                            size=[width, height], qc=json.loads((out / 'pipeline-meta.json').read_text())['qc_summary'])

        out = process(root / 'source/compact_props.png', 'compact_props', 3, 3, 64, .8, mode='prop_pack_3x3')
        sheet = binary(Image.open(out / 'sheet-transparent.png'))
        compact = [('motorbike', 56, None), ('plastic_seats', 48, None), ('produce_basket', 28, None),
                   ('rice', 12, None), ('bamboo', None, 48), ('vegetable', 24, None), ('seedling', 12, None),
                   ('watering_can', 20, None), ('grain_sacks', 28, None)]
        for i, (name, width, height) in enumerate(compact):
            image = sheet.crop(((i % 3)*64, (i // 3)*64, (i % 3+1)*64, (i // 3+1)*64))
            image = image.crop(image.getbbox())
            if width:
                height = round(image.height * width / image.width)
            else:
                width = round(image.width * height / image.height)
            binary(image.resize((width, height), Image.Resampling.NEAREST)).save(root / f'{name}.png')
            manifest['assets'][name] = dict(source='source/compact_props.png', frame_index=i, size=[width, height])

        out = process(root / 'source/villager_walk.png', 'villager_walk', 4, 4, 48, .72, target='npc', mode='walk')
        binary(Image.open(out / 'sheet-transparent.png')).save(root / 'villager_walk.png')
        manifest['assets']['villager_walk'] = dict(source='source/villager_walk.png', size=[192, 192],
                                                  frame_size=[48, 48], rows=['down', 'left', 'right', 'up'],
                                                  qc=json.loads((out / 'pipeline-meta.json').read_text())['qc_summary'])
    (root / 'art-manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2)+'\n')
    print(f'Exported {len(manifest["assets"])} native sprites with nearest resampling and binary alpha')


if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == '__worker__':
        worker()
    else:
        main()
