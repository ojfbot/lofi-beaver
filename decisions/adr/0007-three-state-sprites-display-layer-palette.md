# 0007 — Three-state sprite pixels, display-layer palette, Freestyle vignettes

**Status:** Accepted, 2026-06-09

## Context

Three hard-won findings from the Slice 1–4 build:

1. **White-on-transparent masks are unusable for props.** A prop whose dark
   pixels are transparent lets the bright dithered terrain show through —
   white-on-white, invisible. (Terrain only worked because it sat on the
   black canvas.)
2. **Excalibur 0.30.3 silently drops tinted sprites on the actor draw path**
   (tile graphics tolerate `sprite.tint`; actors do not). Per-sprite tint is
   therefore not a viable palette mechanism.
3. Canvas-2D UI antialiasing creates off-tone grays under any palette
   mechanism, breaking the 1-bit invariant.

## Decision

**Sprite format — three pixel states** (`_sprite_lib.quantize_1bit`):
- `ink`   `(255,255,255,255)` — palette-tinted at display time
- `paper` `(0,0,0,255)` — opaque black; the silhouette *occludes* terrain
- `void`  `(0,0,0,0)` — outside the silhouette
Props additionally get a 1px paper outline ring (`add_outline`) to read
against light ground. Terrain tile planes over-bleed the canvas (size 1.06)
so diamond edges have no ragged seam pixels.

**Palette = display layer.** Everything draws PURE WHITE on black; a
`mix-blend-mode: multiply` overlay div applies INK. Day/night swap is one DOM
write (`palette.ts applyPalette`). Paper is always `#000000` — a non-black
engine background would multiply into a second off-black "paper".
Day ink `#e8e0d0` (warm cream), night ink `#aebad0` (cold blue-gray).

**UI is DOM, not ScreenElements** (Excalibur 0.30 ScreenElements inherit
camera zoom). The day strip and vignette panel are DOM canvases between the
game canvas (z auto) and the palette overlay (z 10), quantized to 1-bit after
drawing (`quantizeCanvas1Bit`) — which also bitmap-crunches the text, on
brand. HUD elements need an opaque paper backing plate (same occlusion rule
as props).

**Vignettes are Blender Freestyle line-art renders** of the same 3D sources
(`run_vignette`): high-res (960×720), `view_units` close-up ortho, banded
quantization (`banded_1bit`: shadow → paper, highlight → ink, midtones →
Bayer ⇒ reads as pen hatching). No dither-free threshold — it eats AA'd line
pixels.

## Invariant (enforced)

A screenshot of the running game contains **exactly two RGB values** in any
phase, panel open or closed. Verified by pixel-histogram probe (day:
`#000` + `#e8e0d0`; night: `#000` + `#aebad0`).

## Future

A pluggable Adobe Firefly node layer feeding the vignette path is filed as a
techdebt bead (`.handoff/20260609-2125-techdebt-adobe-firefly-node-layer.md`).
