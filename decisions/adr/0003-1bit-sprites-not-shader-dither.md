# 0003 — Hand-authored 1-bit tile sprites, not a Bayer dither post-process

**Status:** Accepted, 2026-05-09

## Context

The 1-bit aesthetic has two idiomatic paths:

1. **Hand-authored 1-bit sprites.** Two-colour PNGs, palette-locked, antialias
   off. The Mac Plus / Game Boy lineage.
2. **Post-process dither shader.** Render in grayscale, threshold through a
   Bayer or blue-noise pattern in a fragment shader. The *Return of the Obra
   Dinn* lineage.

## Decision

Hand-authored 1-bit sprites. No shader.

## Why

- Path 2 (Obra Dinn) is for **3D-to-1bit conversion**. Pope renders Obra Dinn
  in 8-bit grayscale and dithers down because the source is a continuous-tone
  3D scene. Our source is already discrete pixel art on a discrete tile grid.
  Dithering a thing that's already binary just adds a shader pass with no
  visual gain.
- Cheaper to iterate. Drawing a 64×32 1-bit tile in a pixel editor is faster
  than writing a GLSL pass and tuning thresholds.
- Easier to keep stable. Path 2 has a known animation-flicker problem (the
  static dither pattern doesn't follow moving content). Pope solved it with a
  cube-map-anchored pattern. We don't want to inherit that engineering bill
  for a prototype.

## Tradeoff (the weakest point)

If the suburb gets large enough that hand-authored sprites become the
bottleneck (i.e. we want runtime-procedural variety in roof patterns,
fences, etc.), this decision will need revisiting. For v0 with six tile
types and three handcrafted maps, sprite labour is negligible.

## How to apply

- Author each tile as a PNG. Two colours: `PAPER` (`#050505`) and `INK`
  (`#e8e0d0`). No anti-aliased edges — pixel-perfect strokes.
- Tile footprint: 64×32 staggered diamond, defined in `src/palette.ts`.
- Water and dams don't get colour variants. They get **stipple/dither
  patterns** drawn into the same two colours. (Drawing the dither *into the
  sprite* is fine; doing it as a screen-space shader is what this ADR
  rejects.)
- If a third colour ever appears in a render, it's a bug.
