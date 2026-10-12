# Làng quê — sprite assets v1

Generated with built-in `image_gen`, then processed with the `generate2dsprite` chroma-key/frame/anchor/QC processor. These are separate PNG objects, never a flattened village painting. Native PNG pixels render at integer 2× with nearest filtering.

`art-manifest.json` records source crops, native output sizes and QC. `source/` preserves the generated magenta sheets unchanged and is ignored by Godot imports. The building sheet uses individual crops to retain complete silhouettes, including the cafe which extends beyond the original nominal column boundary. Each building crop was processed separately with strict QC; source artwork was not cut at that boundary.

## Prompt set and reference roles

The existing `vietnam_village/dinh_linh_khe_m20.png` was a **pixel palette/camera reference**, not an edit target. The character pack walk sheet was the villager's camera/pixel-density reference. The generated geometric 3×3 guide controlled only compact-prop placement.

| Source | Authored prompt direction |
| --- | --- |
| `buildings.png` | Four isolated rural Vietnamese buildings in non-square cells: red tile-roof family house, teal tin-roof house with water tank, tea cafe with corrugated awning and green stools, utilitarian pumping shack. Straight top-down 3/4 camera, warm pixel clusters, complete silhouette and solid magenta padding. |
| `banyan.png` | One broad jade/olive Vietnamese banyan, short intertwined trunk and aerial roots, no ground plate, isolated top-down 3/4 sprite on magenta. |
| `power_pole.png` | One contemporary concrete village pole, three insulators, meter/cabinet, warm lamp, no external cable; cables belong to a separate runtime layer. |
| `compact_props.png` | A 3×3 compact pack: red step-through motorcycle, paired green plastic seats, produce basket, rice tuft, bamboo clump, mature vegetable, seedling, watering can and grain sacks. No terrain plates or people. |
| `villager_walk.png` | One modern Vietnamese villager in olive shirt/navy trousers/conical hat; exactly 4×4 in-place walk phases, rows down/left/right/up, fixed identity/scale/feet and magenta margins. |
| `market_stall.png` | One isolated open-front village stall, red/cream striped roof, wooden counter and produce/seed baskets, no vendor or ground. |
| `greenhouse.png` | One modest plastic-roof greenhouse, green framing, cream base, central open door and plants behind glazing, isolated straight top-down 3/4 view. |

All prompts require crisp pixel clusters, no text/grid/watermark, no smooth 3D painting, no isometric rotation, complete objects and solid `#FF00FF` background. Postprocessing removes magenta, extracts/aligns images and writes binary-alpha native PNGs. Runtime placement/footprints remain in `data/world/lang_que_layout.json`, separate from image size.

Reproduce the native exports with `python client/tools/process_lang_que_art.py --processor /path/to/generate2dsprite.py`. The wrapper forces nearest resampling in the processor subprocess and thresholds final alpha; it does not edit the installed skill or source PNGs.
